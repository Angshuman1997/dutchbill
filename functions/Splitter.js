const splitBill = (membersPay) =>{
    membersPay.sort((a, b) => b.paid - a.paid);
    membersPay.forEach((i)=>{
        i.remain = i.paid -i.cost;
    })
    const zeroUp = membersPay.filter((x)=>x.remain>=0).sort((a, b) => b.paid - a.paid);
    const zeroDown = membersPay.filter((x)=>x.remain<0).sort((a, b) => a.paid - b.paid);
    let j = 0;
    let result=[];
   
    zeroDown.forEach((i)=>{
        let subResult = [];
        while(i.remain < 0){
            let currentRemain = i.remain+zeroUp[j].remain; // -20 + 10 = -10
            if(currentRemain >= 0){
                zeroUp[j].remain = currentRemain;
                subResult.push({Payer: i.person, Receiver: zeroUp[j].person, Amount: i.remain*-1})
                i.remain = 0;
                break;
            } else{
                i.remain = currentRemain;
                subResult.push({Payer: i.person, Receiver: zeroUp[j].person, Amount: zeroUp[j].remain})
                zeroUp[j].remain = 0;
                j = j + 1;
            }  
           
        }
        result.push(subResult);
    })
   
    return result.flat();
   
};

module.exports = splitBill;

// const membersPay = [{person:"Alice", paid: 10, cost: 50}, {person: "Bob", paid: 70, cost: 50}, {person: "Charlie", paid: 40, cost: 50}, {person: "David", paid: 80, cost: 50}];

// console.log(splitBill(membersPay));

// OutPut
// [
//   [
    // { Payer: 'Alice', Receiver: 'David', Amount: 30 },
    // { Payer: 'Alice', Receiver: 'Bob', Amount: 10 }
//   ],
//   [ { Payer: 'Charlie', Receiver: 'Bob', Amount: 10 } ]
// ]
