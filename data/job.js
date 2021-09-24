
const faker = require('faker')


function job(options) {
  return Array.from({length: options.length}).map((_, i) => {
    faker.seed(i)
    return {
      id: faker.datatype.uuid(),
      name: `${faker.vehicle.manufacturer()} ${faker.vehicle.model()}`
    }
  })

}

module.exports = job

