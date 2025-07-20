const { identifyContact } = require('./contactController');
const contactService = require('../services/contactService');
jest.mock('../services/contactService');


describe('contactController - identify', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: { email: 'test@example.com', phoneNumber: '1234567890' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it('should return contact info on success', async () => {
    const mockResult = {
      contact: {
        primaryContactId: 1,
        emails: ['test@example.com'],
        phoneNumbers: ['1234567890'],
        secondaryContactIds: []
      }
    };

    contactService.reconcileContact.mockResolvedValue(mockResult);

    await identifyContact(req, res);


    expect(contactService.reconcileContact).toHaveBeenCalledWith({ email: 'test@example.com', phoneNumber: '1234567890' });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });

  it('should return 500 on error', async () => {
    contactService.reconcileContact.mockRejectedValue(new Error('Something went wrong'));

    await identifyContact(req, res);


    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Something went wrong' });
  });
});
