const supertest = require('supertest');
const { app, startServer, connection } = require('./server.js');
const requestWithSupertest = supertest(app);
const path = require('path');
const fs = require('fs');

function imageToBase64(path) {
    const image = fs.readFileSync(path);
    return 'data:image/png;base64,' + image.toString('base64');
}

const base64Image = imageToBase64('./test.png');
console.log(base64Image);


jest.mock('./tokenverification.js', () => {
    return (req, res, next) => {
        req.user = { id: 'mockUserId', role: 'doctor' };
        next();
    };
});


let server;
beforeAll(() => {
    server = startServer();
});
afterAll((done) => {
    if (server) {
        server.close(() => {
            connection.end(() => {
                done();
            });
        });
    } else {
        done();
    }
});

describe('User Endpoints', () => {
    it('GET /images should show image', async () => {
        const res = await requestWithSupertest.get('/images');
        expect(res.status).toEqual(200);
        expect(res.type).toEqual(expect.stringContaining('json'));
        expect(Array.isArray(res.body)).toBeTruthy();
        if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('id');
            expect(res.body[0]).toHaveProperty('data');
        }
    });

    it('POST /upload should upload an image', async () => {
        const testImagePath = path.join(__dirname, './', 'test.png');
        const res = await requestWithSupertest.post('/upload')
            .attach('image', testImagePath)
            .expect(200);

        expect(res.body).toHaveProperty('message', 'Image uploaded and processed successfully!');
    });

    it('POST /saveMergedImage should save a merged image', async () => {
        const res = await requestWithSupertest.post('/saveMergedImage')
            .send({
                imageData: base64Image,
                id: 1 
            })
            .set('Content-Type', 'application/json')
            .expect(200);

        expect(res.body).toHaveProperty('message', 'Merged image saved successfully!');
    });

    it('GET /images/:id should return a specific image', async () => {
        const testImageId = 1;

        const res = await requestWithSupertest.get(`/images/${testImageId}`);
        expect(res.status).toEqual(200);
        expect(res.type).toEqual(expect.stringContaining('json'));
        expect(res.body).toHaveProperty('id', testImageId);
        expect(res.body).toHaveProperty('data');
    });
});

