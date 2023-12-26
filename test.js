const supertest = require('supertest');
const { app, startServer, connection } = require('./server.js');
const requestWithSupertest = supertest(app);
const path = require('path');

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

    //TODO: Add more endpoints to test
});

