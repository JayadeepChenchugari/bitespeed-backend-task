const prisma = require('../utils/prismaClient');

exports.getFilteredContacts = async (filters) => {
  const where = {};
  if (filters.email) where.email = filters.email;
  if (filters.phoneNumber) where.phoneNumber = filters.phoneNumber;

  return await prisma.contact.findMany({ where });
};

exports.createPrimaryContact = async ({ email, phoneNumber }) => {
  return await prisma.contact.create({
    data: { email, phoneNumber, linkPrecedence: 'primary' }
  });
};

exports.reconcileContact = async ({ email, phoneNumber }) => {
  if (!email && !phoneNumber) {
    throw new Error('Email or phoneNumber is required');
  }

  const matchedContacts = await prisma.contact.findMany({
    where: {
      OR: [
        email ? { email } : undefined,
        phoneNumber ? { phoneNumber } : undefined,
      ].filter(Boolean),
    },
    orderBy: { createdAt: 'asc' },
  });

  let primaryContact;

  if (matchedContacts.length === 0) {
    primaryContact = await this.createPrimaryContact({ email, phoneNumber });
  } else {
    primaryContact = matchedContacts.find(c => c.linkPrecedence === 'primary') || matchedContacts[0];

    for (const contact of matchedContacts) {
      if (contact.linkPrecedence === 'primary' && contact.id !== primaryContact.id) {
        await prisma.contact.update({
          where: { id: contact.id },
          data: { linkPrecedence: 'secondary', linkedId: primaryContact.id }
        });
      }
    }

    const alreadyExists = matchedContacts.some(
      c => c.email === email && c.phoneNumber === phoneNumber
    );

    if (!alreadyExists) {
      await prisma.contact.create({
        data: {
          email,
          phoneNumber,
          linkPrecedence: 'secondary',
          linkedId: primaryContact.id,
        },
      });
    }
  }

  const allLinkedContacts = await prisma.contact.findMany({
    where: {
      OR: [{ id: primaryContact.id }, { linkedId: primaryContact.id }]
    }
  });

  const emails = [...new Set(allLinkedContacts.map(c => c.email).filter(Boolean))];
  const phoneNumbers = [...new Set(allLinkedContacts.map(c => c.phoneNumber).filter(Boolean))];
  const secondaryContactIds = allLinkedContacts
    .filter(c => c.linkPrecedence === 'secondary')
    .map(c => c.id);

  return {
    contact: {
      primaryContactId: primaryContact.id,
      emails,
      phoneNumbers,
      secondaryContactIds,
    }
  };
};
