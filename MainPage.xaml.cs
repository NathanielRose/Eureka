// Copyright (c) Microsoft. All rights reserved.

using System;
using System.Collections.Generic;
using Windows.Devices.Gpio;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Controls.Primitives;
using Windows.UI.Xaml.Media;

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

        public MainPage()
        {
            InitializeComponent();

            timer = new DispatcherTimer();
            timer.Interval = TimeSpan.FromMilliseconds(500);
            timer.Tick += Timer_Tick;
            InitGPIO();
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

        private void Timer_Tick(object sender, object e)
        {
            if (pinValue == GpioPinValue.High)
            {
                pinValue = GpioPinValue.Low;
                foreach (KeyValuePair<int, GpioPin> item in PINS)
                {
                    item.Value.Write(pinValue);
                }
                LED.Fill = redBrush;
            }
            else
            {
                pinValue = GpioPinValue.High;
                foreach (KeyValuePair<int, GpioPin> item in PINS)
                {
                    item.Value.Write(pinValue);
                }
                LED.Fill = redBrush;
                LED.Fill = grayBrush;
            }
        }
    }
}
