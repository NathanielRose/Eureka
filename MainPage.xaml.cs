// Copyright (c) Microsoft. All rights reserved.

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
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
            timer.Interval = TimeSpan.FromMilliseconds(5000);
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


            pinValue = GpioPinValue.Low;
            int[] ports = new int[3] { 17, 23, 27 };

            foreach (var port in ports)
            {
                var pin = gpio.OpenPin(port);
                PINS.Add(port, pin);
                pin.Write(pinValue);
                pin.SetDriveMode(GpioPinDriveMode.Output);
            }

            GpioStatus.Text = "GPIO pin initialized correctly.";

        }

        private async void Timer_Tick(object sender, object e)
        {
            foreach (KeyValuePair<int, GpioPin> item in PINS)
            {
                item.Value.Write(GpioPinValue.Low);
            }

            string message = await ReceiveMessage();

            switch (message)
            {
                case "RED":
                    {
                        pinValue = GpioPinValue.High;
                        PINS[17].Write(pinValue);
                        break;
                    }
                case "GREEN":
                    {
                        pinValue = GpioPinValue.High;
                        PINS[23].Write(pinValue);
                        break;
                    }
                case "BLUE":
                    {
                        pinValue = GpioPinValue.High;
                        PINS[27].Write(pinValue);
                        break;
                    }
                default:
                    {
                        break;
                    }
            }
        }

        public async Task<string> ReceiveMessage()
        {
            try
            {
                var receivedMessage = await this.deviceClient.ReceiveAsync();

                if (receivedMessage != null)
                {
                    var messageData = Encoding.ASCII.GetString(receivedMessage.GetBytes());
                    await deviceClient.CompleteAsync(receivedMessage);
                    return messageData;
                }
                else
                {
                    return string.Empty;
                }
            }
            catch (Exception e)
            {
                Debug.WriteLine("Exception when receiving message:" + e.Message);
                return string.Empty;
            }
        }
    }
}
