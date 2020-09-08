// sever (emit) -> client (receive) -> Acknowlegement -> sever
// client (emit) -> sever (receive) -> Acknowlegement -> client

let form = document.getElementById("form")
let message = document.getElementById("message")
let buttonSend = document.getElementById("send")
let messages = document.getElementById("messages")



let template = document.getElementById("message-template").innerHTML
let locationTemplate = document.getElementById("message-location").innerHTML
let chatSilderTemplate = document.getElementById("chatSilder").innerHTML
let {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})
const socket = io()
socket.on("message", (message)=>{
   console.log(message);
   const html = Mustache.render(template, {
    username: message.username,
    message: message.text,
    date: moment( message.createdAt).format(" h:mm:ss a")
   })
   messages.insertAdjacentHTML("beforeend", html)

})

socket.on("sendLocation", (url) => {
    console.log(url);
    
    const html = Mustache.render(locationTemplate, {
        username: url.username,
        url: url.url,
        date: moment( message.createdAt).format(" h:mm:ss a")
    })
    messages.insertAdjacentHTML("beforeend", html)

})

document.getElementById("form").addEventListener("submit", (evt)=>{
    evt.preventDefault();

    // disabled
    buttonSend.disabled = true;

    socket.emit("sendMessage", message.value, (error)=>{
        console.log(message.value);
        
        buttonSend.disabled = false;
        message.value = " "
       if (error) {
           return console.log(error);
           
       }

       console.log("messenger delivered");
       
    })
    
})
document.getElementById("send-location").addEventListener("click", ()=>{
    
    if (!navigator.geolocation) {
        return alert("geolocation is not support in browser")
    }
    document.getElementById("send-location").disabled = true
    navigator.geolocation.getCurrentPosition((positon)=>{
        // console.log(positon);
        socket.emit("sendLocation", {
            latitude: positon.coords.latitude,
            longitude: positon.coords.longitude
        }, () => {
            document.getElementById("send-location").disabled = false
            console.log("location shared");
            
        })
    })
    
})

socket.emit("join", {username, room}, (error) => {
  if (error) {
      alert(error)
      location.href = "/"
  }
})

socket.on("roomData", ({room, users})=> {
   console.log(room);
   console.log(users);
   const html = Mustache.render(chatSilderTemplate, {
       room,
       users
   })
   document.getElementById("slider").innerHTML = html
})