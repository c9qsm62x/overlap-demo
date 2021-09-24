// Create a new temporary list called “activeList”.
// You begin on the left of your axisList, adding the first item to the activeList.

// Now you have a look at the next item in the axisList and compare it with all items
//  currently in the activeList (at the moment just one):
//  - If the new item’s left is greater then the current activeList-item right, then remove
// the activeList-item from the activeList
//  - otherwise report a possible collision between the new axisList-item and the current
//  activeList-item.

// Add the new item itself to the activeList and continue with the next item in the axisList.


let operations = 0;

function removeAtIndex(list, index) {
  // console.log('removeAtIndex', [...list.slice(0,index),...list.slice(index + 1)])
  return [...list.slice(0, index), ...list.slice(index + 1)];
}

function sortSweep(sorted, rowNum) {
  const activeList = [];
  let clash = [];
  let list = [...sorted];
  let result = [];

  // 1. You begin on the left of your axisList, adding the first item to the activeList.
  activeList.push({
    startTime: new Date(list[0].start).getTime(),
    endTime: new Date(list[0].end).getTime(),
    ...list[0],
  });

  for (let i = 1; i < list.length; i++) {
    const current = {
      startTime: new Date(list[i].start).getTime(),
      endTime: new Date(list[i].end).getTime(),
      ...list[i],
    };

    let addToActiveList;
    for (let j = 0; j < activeList.length; j++) {
      operations++;
      // 2. If the new item’s left is greater then the current activeList-item right, then remove
      // the activeList-item from the activeList

      if (current.startTime > activeList[j]["endTime"]) {
        activeList.splice(j, 1);
        j--;
        result.push(current);
      } else {
        if (
          current.startTime < activeList[j]["endTime"] &&
          activeList[j]["startTime"] < current.endTime
        ) {
          clash.push(current);
          list = removeAtIndex(list, i);
          addToActiveList = current;
          i--;
          break;
        }
      }
    }
    if (addToActiveList !== current) {
      activeList.push(current);
    }
  }
  let test = [];
  if (clash.length) {
    test = sortSweep(clash, rowNum + 1);
  }

  return [list, ...test];
}

module.exports = sortSweep;
