const {  addDays, isAfter } = require('date-fns')
const faker = require('faker')
const vehicles = require('./job')

function getWithSeed(i) {
    return (call) => {
        faker.seed(i)
        return call()
    }
}


    
function generateItems(options, idx) {
 let lastDate;
 const startDate = new Date(options.start)
 const endDate = new Date(options.end)
    let index = 0
 let i = parseInt(`${idx}000${startDate.getTime()}`)
 lastDate = startDate
 const arr = []
 while(isAfter(endDate, lastDate)) {
    let i = parseInt(`${idx}000${index++}`)
     const withSeed = getWithSeed(parseInt(i))

     const start = addDays(lastDate, faker.datatype.number({
         min: 0,
         max: 2
     }))

     

     lastDate = addDays(lastDate, faker.datatype.number({
        min: 3,
        max: 5
    }))
    arr.push({
        id: withSeed(faker.datatype.uuid),
        start: start,
        end: lastDate,
        description: withSeed(faker.commerce.department)
    })
 }
 return arr
}

function generateEvent(options) {
    const vehiclesData = vehicles(options)

    return {
        vehicles: vehiclesData.map((vehicle, i) => {
            return {
                ...vehicle,
                tasks: generateItems(options, i)
            }
        })
    }
}
 module.exports = generateEvent