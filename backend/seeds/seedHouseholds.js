require('dotenv').config();

const mongoose = require('mongoose');

const Household = require('../models/Household');

const households = [
  { name: 'Household 01', invitationCode: 'H01-SOLAR' },
  { name: 'Household 02', invitationCode: 'H02-SOLAR' },
  { name: 'Household 03', invitationCode: 'H03-SOLAR' },
  { name: 'Household 04', invitationCode: 'H04-SOLAR' },
  { name: 'Household 05', invitationCode: 'H05-SOLAR' },
  { name: 'Household 06', invitationCode: 'H06-SOLAR' },
  { name: 'Household 07', invitationCode: 'H07-SOLAR' },
  { name: 'Household 08', invitationCode: 'H08-SOLAR' },
];

const seedHouseholds = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not configured');
  }

  await mongoose.connect(process.env.MONGO_URI);

  for (const household of households) {
    await Household.updateOne(
      { invitationCode: household.invitationCode },
      { $setOnInsert: household },
      { upsert: true }
    );
  }

  console.log(`Ensured ${households.length} development households exist.`);
};

seedHouseholds()
  .catch((error) => {
    console.error('Household seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
