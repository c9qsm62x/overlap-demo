

const event = require('../data/event')
exports.seed = function(knex) {
  // Deletes ALL existing entries

  const data = event({length: 15, start: new Date('2021-01-01'), end: new Date('2021-12-31')}).vehicles.flatMap((vehicle) => {
    return  vehicle.tasks.map(event => ({
      ...event,
      row: 0,
      job: vehicle.id
    }))
  })
  
  return knex('event').del()
    .then(function () {
      
      
      return knex('event').insert(data);
    });
};
