"use strict";
let surname, name,email,id;

function NewUser(surname, name, email) {
    this.surname=surname;
    this.name=name;
    this.email=email;
}
function getcash(hint){
    return +(this.cash);
}
let user= new NewUser(surname,name,email);
id=Symbol("id");
user['level']=1;
user[id]=1;
user[Symbol.toPrimitive]=getcash;
