const supertest = require('supertest');
const { app, startServer, connection } = require('./server.js');
const requestWithSupertest = supertest(app);

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
});

