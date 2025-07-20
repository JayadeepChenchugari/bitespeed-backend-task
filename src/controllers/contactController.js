const contactService = require('../services/contactService');

exports.healthCheck = async (req, res) => {
  try {
    const filters = req.query;
    const contacts = await contactService.getFilteredContacts(filters);
    return res.status(200).json(contacts);
  } catch (error) {
    console.error('[HealthCheck] DB Error:', error.message || error);
    return res.status(500).json({ error: 'Database connection failed' });
  }
};

exports.createContact = async (req, res) => {
  try {
    const data = req.body;

    if (!data.email && !data.phoneNumber) {
      return res.status(400).json({ error: 'Email or phoneNumber is required' });
    }

    const contact = await contactService.createPrimaryContact(data);
    return res.status(201).json({ message: 'Contact created successfully', contact });
  } catch (error) {
    console.error('[CreateContact] Error:', error.message || error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.identifyContact = async (req, res) => {
  try {
    const data = req.body;

    if (!data.email && !data.phoneNumber) {
      return res.status(400).json({ error: 'Email or phoneNumber is required' });
    }

    const result = await contactService.reconcileContact(data);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[IdentifyContact] Error:', error.message || error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};
