// Copyright (c) Microsoft. All rights reserved.

using System;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using Windows.Devices.Gpio;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Controls.Primitives;
using Windows.UI.Xaml.Media;
using Microsoft.Azure.Devices.Client;
using System.Text;
using System.Diagnostics;

namespace Blinky
{
    public sealed partial class MainPage : Page
    {
        // private MyGpioPin;

        private Dictionary<int, GpioPin> PINS = new Dictionary<int, GpioPin>();

        private GpioPinValue pinValue;

        private DispatcherTimer timer;
        private SolidColorBrush redBrush = new SolidColorBrush(Windows.UI.Colors.Red);
        private SolidColorBrush grayBrush = new SolidColorBrush(Windows.UI.Colors.LightGray);

        private static string deviceClientConnString = "HostName=Project-Eureka-IoT-Hub.azure-devices.net;DeviceId=EurekaPi;SharedAccessKey=bRLA01/9lysbaq4rx3CsF5CoqtOeOLArtiVjNQHHZMQ=";
        private DeviceClient deviceClient = DeviceClient.CreateFromConnectionString(deviceClientConnString);

        public MainPage()
        {
            InitializeComponent();
            InitGPIO();

            timer = new DispatcherTimer();
            timer.Interval = TimeSpan.FromMilliseconds(10);
            timer.Tick += Timer_Tick;

            if (PINS != null)
            {
                timer.Start();
            }
        }

        private void InitGPIO()
        {
            var gpio = GpioController.GetDefault();

            // Show an error if there is no GPIO controller
            if (gpio == null)
            {
                PINS = null;

                GpioStatus.Text = "There is no GPIO controller on this device.";
                return;
            }


            pinValue = GpioPinValue.High;
            int[] ports = new int[5] { 17, 25, 23, 27, 16 };
            // 17 red
            // 25 red
            // 23 green
            // 27 green
            // 16 blue
            // 1 solid 2 blink else off

            foreach (var port in ports)
            {
                var pin = gpio.OpenPin(port);
                PINS.Add(port, pin);
                pin.Write(pinValue);
                pin.SetDriveMode(GpioPinDriveMode.Output);
            }

            GpioStatus.Text = "GPIO pin initialized correctly.";

        }

        private void SetState(string[] state)
        {
            int i = 0;
            foreach (KeyValuePair<int, GpioPin> item in PINS)
            {
                var togglePinValue = GpioPinValue.High;

                if (state[i] == "1")
                {
                    item.Value.Write(GpioPinValue.High);
                }
                else if (state[i] == "2")
                {
                    item.Value.Write(GpioPinValue.High);
                }
                else
                {
                    item.Value.Write(GpioPinValue.Low);
                }

                i++;
            }
        }

        private async void Timer_Tick(object sender, object e)
        {             
            await ProcessMessageQueue();
        }

        public async Task ProcessMessageQueue()
        {
            try
            {
                var receivedMessage = await this.deviceClient.ReceiveAsync();

                if (receivedMessage != null)
                {
                    var messageData = Encoding.ASCII.GetString(receivedMessage.GetBytes());
                    var state = messageData.Split(',');
                    await deviceClient.CompleteAsync(receivedMessage);
                    SetState(state);
                }
            }
            catch (Exception e)
            {
                Debug.WriteLine("Exception when receiving message:" + e.Message);
            }
        }

        // message on

        // message off
    }
}
