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
    // No matches, create new primary
    primaryContact = await this.createPrimaryContact({ email, phoneNumber });
  } else {
    // Determine oldest primary contact
    primaryContact = matchedContacts.find(c => c.linkPrecedence === 'primary') || matchedContacts[0];

    // Convert any extra primaries to secondary
    for (const contact of matchedContacts) {
      if (contact.linkPrecedence === 'primary' && contact.id !== primaryContact.id) {
        await prisma.contact.update({
          where: { id: contact.id },
          data: {
            linkPrecedence: 'secondary',
            linkedId: primaryContact.id
          }
        });
      }
    }

    // Check if the exact combo exists
    const exactMatch = matchedContacts.find(
      c => c.email === email && c.phoneNumber === phoneNumber
    );

    const emailExists = matchedContacts.some(c => c.email === email);
    const phoneExists = matchedContacts.some(c => c.phoneNumber === phoneNumber);

    // If not an exact match and either value is new, create secondary
    if (!exactMatch && (!emailExists || !phoneExists)) {
      await prisma.contact.create({
        data: {
          email,
          phoneNumber,
          linkPrecedence: 'secondary',
          linkedId: primaryContact.id
        }
      });
    }
  }

  // Fetch all related contacts for final response
  const allLinkedContacts = await prisma.contact.findMany({
    where: {
      OR: [
        { id: primaryContact.id },
        { linkedId: primaryContact.id }
      ]
    },
    orderBy: {
      createdAt: 'asc'
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
