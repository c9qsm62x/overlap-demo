
const job = require('../data/job')
exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('job').del()
    .then(function () {
      // Inserts seed entries
      return knex('job').insert(job({length:15}).map((data) => {
        return {
          ...data
        }
      }));
    });
};
