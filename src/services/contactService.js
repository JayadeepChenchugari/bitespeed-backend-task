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
      deletedAt: null,
      OR: [
        email ? { email } : undefined,
        phoneNumber ? { phoneNumber } : undefined,
      ].filter(Boolean),
    },
    orderBy: { createdAt: 'asc' }
  });

  let primaryContact;

  if (matchedContacts.length === 0) {
    // No matches, create new primary
    primaryContact = await this.createPrimaryContact({ email, phoneNumber });
  } else {
    // Determine primary
    primaryContact = matchedContacts.find(c => c.linkPrecedence === 'primary') || matchedContacts[0];

    // Update others to secondary
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

    const exactMatch = matchedContacts.find(
      c => c.email === email && c.phoneNumber === phoneNumber
    );

    const emailExists = matchedContacts.some(c => c.email === email);
    const phoneExists = matchedContacts.some(c => c.phoneNumber === phoneNumber);

    // Only create a new secondary if it's not already present
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

  // Re-fetch all linked contacts
    // Always determine the primary again in case of changes
  const truePrimaryId = primaryContact.linkPrecedence === 'primary'
    ? primaryContact.id
    : primaryContact.linkedId;

  const allLinkedContacts = await prisma.contact.findMany({
    where: {
      deletedAt: null,
      OR: [
        { id: truePrimaryId },
        { linkedId: truePrimaryId }
      ]
    },
    orderBy: { createdAt: 'asc' }
  });

  const emails = [...new Set(allLinkedContacts.map(c => c.email).filter(Boolean))];
  const phoneNumbers = [...new Set(allLinkedContacts.map(c => c.phoneNumber).filter(Boolean))];
  const secondaryContactIds = allLinkedContacts
    .filter(c => c.linkPrecedence === 'secondary')
    .map(c => c.id);

  return {
    contact: {
      primaryContactId: truePrimaryId,
      emails,
      phoneNumbers,
      secondaryContactIds,
    }
  };
};
