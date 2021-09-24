const socket = io()
//elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages');
const $messagesForLink = document.querySelector('#messagesForLink');

//templates
const messageTamplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;


//options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () =>{
    // new message element 
    const $newMessage = $messages.lastElementChild

    // height of new message 
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
    
    // visible height
    const visibleHeight = $messages.offsetHeight

    //height of message container
    const containerHeight = $messages.scrollHeight

    // how far have i scrolled?
    const scrollOffset = $messages.scrollTop  + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }

}

socket.on('message', (message)=>{
   console.log(message);
   const html = Mustache.render(messageTamplate, {
       username: message.username,
       message: message.text,
       createdAt: moment(message.createdAt).format('h:mm a')
   });
   $messages.insertAdjacentHTML('beforeend', html);
   autoscroll();
})

socket.on('locationMessage', (locationUrl) => {
    console.log(locationUrl);
    const html = Mustache.render(locationMessageTemplate, {
        username:locationUrl.username,
        url: locationUrl.url,
        createdAt: moment(locationUrl.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll()

})

socket.on('roomData', ({ room, users})=>{
  const html = Mustache.render(sidebarTemplate, {
      room,
      users
  })

  document.querySelector('#sidebar').innerHTML = html;
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
        
    //disable
    $messageFormButton.setAttribute('disabled', 'disabled')
    
    const message = e.target.elements.message.value;

    socket.emit('sendMessage', message, (error)=>{
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        //enable
        if (error) {
             return console.log(error);
        }

        console.log('message delivered');
    })
})
   

$sendLocationButton.addEventListener('click', ()=>{
    if (!navigator.geolocation) {
        return alert(' geolocation is not supported on this browser')
    }
      
    //disable location button for a moment to not send location many times
    $sendLocationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude, 
        }, ()=>{
            //enable location button
            $sendLocationButton.removeAttribute('disabled');
            console.log('location shared');
        })
    })

})

socket.emit('join', { username, room}, (error)=> {
    if (error) {
        alert('error')
        location.href = '/'
    }
});

