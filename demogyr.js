//declaration of services and characteristics
agservice  = '326a9000-85cb-9195-d9dd-464cfbbae75a';
agwritechar = '326a9001-85cb-9195-d9dd-464cfbbae75a';
aggetvalschar = '326a9006-85cb-9195-d9dd-464cfbbae75a';

//function to see if web bluetooth is available
function isWebBLEOn(){
    if (!navigator.bluetooth){
        console.log ('Web Bluetooth is not Available!' )
        return false
    }
    return true
}

//make the connect button work
document.querySelector('#readbatterylevel').addEventListener('click', funct)
function funct(event) {
    console.log('starting');
    event.stopPropagation()
    event.preventDefault()
    if(isWebBLEOn()){
        onReadBatteryLevelButtonClick();
    }
}
//make the start notifications button work
document.querySelector('#startNotifications').addEventListener('click', function (event) {
 if(isWebBLEOn()){
     onStartNotificationsButtonClick();
 }
});
//make the stop notifications button work
document.querySelector('#stopNotifications').addEventListener('click', function (event) {
    if(isWebBLEOn()){
        onStopNotificationsButtonClick();
    }
});
// make the reset button work
document.querySelector('#reset').addEventListener('click', function (event) {
    if(isWebBLEOn()){
        onResetButtonClick();
    }
});
var bluetoothDevice;
var batteryLevelCharacteristic;

function onReadBatteryLevelButtonClick() {
    return (bluetoothDevice ? Promise.resolve() : requestDevice())
        .then(connectDeviceAndCacheCharacteristics)
        .then(_ => {
            console.log('Reading Battery Level...');
            return batteryLevelCharacteristic.readValue();
        })
        .catch(error => {
            console.log('Argh! ' + error);
        });
}

function requestDevice() {
    console.log('Requesting any Bluetooth Device...');
    return navigator.bluetooth.requestDevice({
        optionalServices: [agservice,'battery_service'],
        filters: [{namePrefix: ['MetaWear']}/*{services: ['battery_service']}*/],
        })
        .then(device => {
            bluetoothDevice = device;
            bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);
        });
}

function connectDeviceAndCacheCharacteristics() {
    if (bluetoothDevice.gatt.connected && batteryLevelCharacteristic) {
        return Promise.resolve();
    }

    console.log('Connecting to GATT Server...');
    return bluetoothDevice.gatt.connect()
        .then(server => {
            serverInstanse = server;
            console.log('Getting Battery Service...');
            return server.getPrimaryService('battery_service');
        })
        .then(service => {
            console.log('Getting Battery Level Characteristic...');
            return service.getCharacteristic('battery_level');
        })
        .then(characteristic => {
            batteryLevelCharacteristic = characteristic;
            batteryLevelCharacteristic.addEventListener('characteristicvaluechanged',
                handleBatteryLevelChanged);
            document.querySelector('#startNotifications').disabled = false;
            document.querySelector('#stopNotifications').disabled = true;
        })
        .then(_ => {
            return serverInstanse.getPrimaryService(agservice)
                .then(newService => {
                    writechar = newService.getCharacteristic(agwritechar);
                    var val = Uint8Array.of([0x01]);
                    writechar.writeValue(val);
                    var writeval = writechar.readValue();
                    console.log(writeval);
                    if(writechar){
                        console.log('got write char');
                    }
                    valschar = newService.getCharacteristic(aggetvalschar);
                    if(valschar){
                        console.log('got vals char');
                    }
                }).then (characteristics => {

                })
        })
}

/* This function will be called when `readValue` resolves and
 * characteristic value changes since `characteristicvaluechanged` event
 * listener has been added. */
function handleBatteryLevelChanged(event) {
    let batteryLevel = event.target.value.getUint8(0);
    console.log('> Battery Level is ' + batteryLevel + '%');
}

function onStartNotificationsButtonClick() {
    console.log('Starting Battery Level Notifications...');
    batteryLevelCharacteristic.startNotifications()
        .then(_ => {
            console.log('> Notifications started');
            document.querySelector('#startNotifications').disabled = true;
            document.querySelector('#stopNotifications').disabled = false;
        })
        .catch(error => {
            console.log('Argh! ' + error);
        });
}

function onStopNotificationsButtonClick() {
    console.log('Stopping Battery Level Notifications...');
    batteryLevelCharacteristic.stopNotifications()
        .then(_ => {
            console.log('> Notifications stopped');
            document.querySelector('#startNotifications').disabled = false;
            document.querySelector('#stopNotifications').disabled = true;
        })
        .catch(error => {
            console.log('Argh! ' + error);
        });
}

function onResetButtonClick() {
    if (batteryLevelCharacteristic) {
        batteryLevelCharacteristic.removeEventListener('characteristicvaluechanged',
            handleBatteryLevelChanged);
        batteryLevelCharacteristic = null;
    }
    // Note that it doesn't disconnect device.
    bluetoothDevice = null;
    console.log('> Bluetooth Device reset');
}
function onDisconnected() {
    console.log('> Bluetooth Device disconnected');
    connectDeviceAndCacheCharacteristics()
        .catch(error => {
            console.log('Argh! ' + error);
        });
}
//
// document.querySelector('#configure').addEventListener('click',function(event){
//    if(isWebBLEOn()){
//        startAG();
//    }
// });

// function startAG() {
//     var val = Uint8Array.of([0x01]);
//     writechar.writeValue(val);
//
//}