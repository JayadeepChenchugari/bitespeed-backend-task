const contactService = require('../services/contactService');

exports.healthCheck = async (req, res) => {
  try {
    const filters = req.query;
    const contacts = await contactService.getFilteredContacts(filters);
    res.json(contacts);
  } catch (error) {
    console.error('DB Error:', error);
    res.status(500).json({ error: 'Could not connect to DB' });
  }
};

exports.createContact = async (req, res) => {
  try {
    const data = req.body;
    const contact = await contactService.createPrimaryContact(data);
    res.status(201).json({ message: 'Contact created', contact });
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.identifyContact = async (req, res) => {
  try {
    const data = req.body;
    const result = await contactService.reconcileContact(data);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in /identify:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};
