const express = require('express');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config();

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

// GET / — DB Health Check
app.get('/', async (req, res) => {
  try {
    const { email, phoneNumber } = req.query;

    const filters = {};

    if (email) {
      filters.email = email;
    }

    if (phoneNumber) {
      filters.phoneNumber = phoneNumber;
    }

    const contacts = await prisma.contact.findMany({
      where: filters
    });

    res.json(contacts);
  } catch (error) {
    console.error('DB Error:', error);
    res.status(500).json({ error: 'Could not connect to DB' });
  }
});


// POST /create-contact — Manually create contact
app.post('/create-contact', async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    const contact = await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkPrecedence: 'primary',
      },
    });

    res.status(201).json({ message: 'Contact created', contact });
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /identify — Main Reconciliation Logic
app.post('/identify', async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({ error: 'Email or phoneNumber is required' });
    }

    // STEP 1: Find all contacts that match either email or phone
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
      // No match: Create a new primary contact
      primaryContact = await prisma.contact.create({
        data: {
          email,
          phoneNumber,
          linkPrecedence: 'primary',
        },
      });
    } else {
      // STEP 2: Determine the earliest primary
      primaryContact = matchedContacts.find(c => c.linkPrecedence === 'primary') || matchedContacts[0];

      // STEP 3: Ensure all other primary contacts become secondary
      for (const contact of matchedContacts) {
        if (contact.linkPrecedence === 'primary' && contact.id !== primaryContact.id) {
          await prisma.contact.update({
            where: { id: contact.id },
            data: {
              linkPrecedence: 'secondary',
              linkedId: primaryContact.id,
            },
          });
        }
      }

      // STEP 4: If this is a new contact (not an exact match), insert as secondary
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

    // STEP 5: Fetch all related contacts (primary + secondaries)
    const allLinkedContacts = await prisma.contact.findMany({
      where: {
        OR: [
          { id: primaryContact.id },
          { linkedId: primaryContact.id },
        ],
      },
    });

    // STEP 6: Consolidate response data
    const emails = [...new Set(allLinkedContacts.map(c => c.email).filter(Boolean))];
    const phoneNumbers = [...new Set(allLinkedContacts.map(c => c.phoneNumber).filter(Boolean))];
    const secondaryContactIds = allLinkedContacts
      .filter(c => c.linkPrecedence === 'secondary')
      .map(c => c.id);

    res.status(200).json({
      contact: {
        primaryContactId: primaryContact.id,
        emails,
        phoneNumbers,
        secondaryContactIds,
      },
    });

  } catch (error) {
    console.error('Error in /identify:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
