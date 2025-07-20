const mockedFindMany = jest.fn();
const mockedCreate = jest.fn();
const mockedUpdate = jest.fn();

jest.mock('../utils/prismaClient', () => ({
  contact: {
    findMany: mockedFindMany,
    create: mockedCreate,
    update: mockedUpdate,
  }
}));

const contactService = require('./contactService');

describe('Contact Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('links as secondary when matching contact by email exists', async () => {
    mockedFindMany.mockResolvedValueOnce([
      { id: 1, email: 'a@a.com', phoneNumber: null, linkPrecedence: 'primary', deletedAt: null }
    ]);

    mockedCreate.mockResolvedValue({
      id: 2, email: 'a@a.com', phoneNumber: '456', linkPrecedence: 'secondary', linkedId: 1
    });

    mockedFindMany.mockResolvedValueOnce([
      { id: 1, email: 'a@a.com', phoneNumber: null, linkPrecedence: 'primary', deletedAt: null },
      { id: 2, email: 'a@a.com', phoneNumber: '456', linkPrecedence: 'secondary', linkedId: 1, deletedAt: null }
    ]);

    const result = await contactService.reconcileContact({
      email: 'a@a.com',
      phoneNumber: '456'
    });

    expect(result.contact.primaryContactId).toBe(1);
    expect(result.contact.secondaryContactIds).toContain(2);
  });

  test('links as secondary when matching contact by phone exists', async () => {
    mockedFindMany.mockResolvedValueOnce([
      { id: 3, email: null, phoneNumber: '789', linkPrecedence: 'primary', deletedAt: null }
    ]);

    mockedCreate.mockResolvedValue({
      id: 4, email: 'b@b.com', phoneNumber: '789', linkPrecedence: 'secondary', linkedId: 3
    });

    mockedFindMany.mockResolvedValueOnce([
      { id: 3, email: null, phoneNumber: '789', linkPrecedence: 'primary', deletedAt: null },
      { id: 4, email: 'b@b.com', phoneNumber: '789', linkPrecedence: 'secondary', linkedId: 3, deletedAt: null }
    ]);

    const result = await contactService.reconcileContact({
      email: 'b@b.com',
      phoneNumber: '789'
    });

    expect(result.contact.primaryContactId).toBe(3);
    expect(result.contact.secondaryContactIds).toContain(4);
  });

  test('creates a new primary when no match is found', async () => {
    mockedFindMany.mockResolvedValueOnce([]);

    mockedCreate.mockResolvedValue({
      id: 10, email: 'e@e.com', phoneNumber: '123', linkPrecedence: 'primary'
    });

    mockedFindMany.mockResolvedValueOnce([
      { id: 10, email: 'e@e.com', phoneNumber: '123', linkPrecedence: 'primary', deletedAt: null }
    ]);

    const result = await contactService.reconcileContact({
      email: 'e@e.com',
      phoneNumber: '123'
    });

    expect(mockedCreate).toHaveBeenCalled();
    expect(result.contact.primaryContactId).toBe(10);
    expect(result.contact.secondaryContactIds).toEqual([]);
  });

  test('avoids duplicate primary and returns correct hierarchy when email and phone match', async () => {
  mockedFindMany.mockResolvedValue([
    {
      id: 1,
      email: 'a@example.com',
      phoneNumber: '123',
      linkPrecedence: 'primary',
      linkedId: null,
      createdAt: new Date('2021-01-01'),
    },
    {
      id: 2,
      email: 'a@example.com',
      phoneNumber: '456',
      linkPrecedence: 'secondary',
      linkedId: 1,
      createdAt: new Date('2021-01-02'),
    },
  ]);

  const result = await contactService.reconcileContact({
    email: 'a@example.com',
    phoneNumber: '123',
  });

  expect(result.contact.primaryContactId).toBe(1);
  expect(result.contact.emails).toContain('a@example.com');
  expect(result.contact.phoneNumbers).toContain('123');
  expect(result.contact.secondaryContactIds).toContain(2);
});


 test('ignores soft-deleted contacts during matching and creates new primary', async () => {
  mockedFindMany.mockResolvedValue([
    {
      id: 7,
      email: 'soft@example.com',
      phoneNumber: '999',
      linkPrecedence: 'primary',
      deletedAt: new Date(), // Soft-deleted
    },
  ]);

  mockedCreate.mockResolvedValue({
    id: 8,
    email: 'new@example.com',
    phoneNumber: '999',
    linkPrecedence: 'primary',
    linkedId: null,
  });

  const result = await contactService.reconcileContact({
    email: 'new@example.com',
    phoneNumber: '999',
  });

  expect(mockedCreate).toHaveBeenCalled();
  expect(result.contact.primaryContactId).toBe(7);
  expect(result.contact.emails).toContain('soft@example.com');
});

});
