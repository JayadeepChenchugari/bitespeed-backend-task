const request = require('supertest');
const app = require('../../app'); // Make sure this points to your app

describe('POST /identify', () => {
  it('should return 200 and contact structure for valid input', async () => {
    const res = await request(app)
      .post('/identify')
      .send({ email: 'test@example.com', phoneNumber: '1234567890' });

    expect(res.status).toBe(200);
    expect(res.body.contact).toBeDefined();
    expect(res.body.contact.primaryContactId).toBeDefined();
    expect(Array.isArray(res.body.contact.emails)).toBe(true);
    expect(Array.isArray(res.body.contact.phoneNumbers)).toBe(true);
  });

  it('should return 400 for invalid payload', async () => {
    const res = await request(app)
      .post('/identify')
      .send({}); // no email or phoneNumber

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Email or phoneNumber is needed' });
  });
});
