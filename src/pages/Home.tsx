import { IonLoading, IonRow, IonCol, IonInput, IonButton, IonCard, IonCardContent, IonContent, IonFooter, IonHeader, IonItem, IonLabel, IonList, IonPage, IonSelect, IonSelectOption, IonText, IonTitle, IonToolbar } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import './Home.css';
import { Filesystem, Encoding, Directory } from '@capacitor/filesystem';
import { CIDPrint, CIDPrinterListenerTypes, Device, EventType, PrinterLibraryEvent, PrinterLibraryActionType, InitResult, PrinterResult, TicketData, BluetoothResult, DeviceResult } from '@captureid/capacitor3-cidprint';
import React, { Component, useState } from 'react';

export class Home extends Component {

  ui: boolean = false;
  all: boolean = false;
  printerListener: any;
  barcodevalue: any;
  barcodetype: any;
  bthasFocus: boolean = false;
  devices: Array<Device> = new Array<Device>();
  statuslist: Array<string> = new Array<string>();
  isConnecting: boolean = false;

  state = {
    enabled: false,
    connected: false,
    validbt: false,
    btaddress: '',
    devname: '',
    devmac: '',
    devices: Array<Device>(),
    statuslist: Array<string>(),
    status: '',
    label: ''
  }
  constructor(props: any) {
    super(props);
    this.state = { enabled: false, connected: false, validbt: false, btaddress: '', devname: '', devmac: '', devices: [], statuslist: [], status: '', label: '' }
    this.init();
  }

  handlePrinterLibraryEvents(event: PrinterLibraryEvent) {
    console.log(event);
    switch (event.action) {
      case PrinterLibraryActionType.BLUETOOTH_DISABLE:
        this.statuslist.push('Bluetooth disabled: - ' + event.type + ' - ' + event.message);
        break;
      case PrinterLibraryActionType.BLUETOOTH_ENABLE:
        this.statuslist.push('Bluetooth enabled: - ' + event.type + ' - ' + event.message);
        this.setState({ enabled: event.type === EventType.SUCCESS });
        break;
      case PrinterLibraryActionType.BLUETOOTH_INITIALIZE:
        let data: BluetoothResult = event.data as BluetoothResult;
        console.log(data);
        break;
      case PrinterLibraryActionType.DISCOVER_START:
        break;
      case PrinterLibraryActionType.DISCOVER_DETECT:
      case PrinterLibraryActionType.DISCOVER_FINISH:
        let devs: BluetoothResult = event.data as BluetoothResult;
        let devi = devs.discovereddevice as Device;
        if(devi != undefined){
          this.devices.push(devi);
        }
        //console.log(dev);
        break;
      case PrinterLibraryActionType.CONNECT:
        this.isConnecting = false;
        //        CIDPlugin.enableScanCommandButton({enable: true});
        if (event.type === EventType.SUCCESS || event.type === EventType.NOTIFY) {
          let data: BluetoothResult = event.data as BluetoothResult;
          this.statuslist.push('device connected: - ' + data.connecteddevice?.name);
          this.setState({ connected: true });
        } else {
          this.statuslist.push('device not connected: - ' + event.type + ' - ' + event.message);
        }
        break;
      case PrinterLibraryActionType.DISCONNECT:
        this.statuslist.push('device disconnected:');
        this.setState({ connected: false });
        break;
      case PrinterLibraryActionType.PRINT:
        let result: PrinterResult = event.data as PrinterResult;
        this.statuslist.push('Printer status - ' + result.status);
        break;
      default:
        this.statuslist.push(event.action + ' - ' + event.type + ' - ' + event.message);
    }
    this.setState({ statuslist: this.statuslist });
    this.setState({ devices: this.devices});
  }

  async init() {
    CIDPrint.addListener(CIDPrinterListenerTypes.PRINTER_LIBRARY, this.handlePrinterLibraryEvents.bind(this));
    let event: PrinterLibraryEvent = await CIDPrint.initCIDPrinterLib();
    console.log(event);
    if (event.type === EventType.SUCCESS) {
      if (event.action === PrinterLibraryActionType.INITIALIZE) {
        this.enableBluetooth();
        let data: InitResult = event.data as InitResult;
        console.log(data);
        for (let i = 0; i < data.permissions.length; i++) {
          console.log(data.permissions[i]);
        }
      }
    }
  }

  async writeLabel(){

  }

  async enableBluetooth() {
    this.setState({ enabled: await CIDPrint.enableBluetoothPrinting({ enable: true }) })
  }

  discover() {
    CIDPrint.discoverDevices();
  }

  async connect(printer: Device) {
    this.setState({ connected: await CIDPrint.connectToPreferredPrinter({ mac: printer.address }) });
  }

  async connectToPrinter(mac: string) {
    this.setState({ connected: await CIDPrint.connectToPreferredPrinter({ mac: mac }) });
  }

  async connectToPW2() {
    this.setState({ connected: await CIDPrint.connectToPreferredPrinter({ mac: "e47fb2fdadaf" }) });
  }

  async setMediaSize(width: number, height: number) {
    CIDPrint.setupMediaSize({ width: width, height: height });
  }

  async print(label: string) {
    this.setState({ status: 'printing Label' });
    CIDPrint.enableDispendingMode({ enable: false });
    await CIDPrint.printLabel({ label: label });
  }

  async printInput(inputLabel: string) {
    this.setState({ status: 'printing Label' });
    CIDPrint.enableDispendingMode({ enable: false });
    await CIDPrint.printData({ data: inputLabel });
  }

  async printWithData(label: string, data: string[]) {
    this.setState({ status: 'printing Label' });
    await CIDPrint.printLabelWithData({ label: label, data: data });
  }

  public validateBTAddress(value: string) {
    this.barcodevalue = value;
    this.setState({ btaddress: this.barcodevalue });
    this.setState({ validbt: value.length === 12 });
  }

  public onPrinterChanged(value: string) {
    this.barcodevalue = value;
    this.connectToPrinter(value);
  }

  public btFocus(focus: boolean) {
    if (focus) {
      this.barcodevalue = '';
      this.setState({ btaddress: this.barcodevalue });
    }
    this.bthasFocus = focus;
  }

  getStatus() {
    CIDPrint.getPrinterStatus();
  }

  remove() {
    this.printerListener.remove();
  }

  add() {
    this.printerListener = CIDPrint.addListener(CIDPrinterListenerTypes.PRINTER_LIBRARY, this.handlePrinterLibraryEvents.bind(this));
  }


  render() {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Bluetooth Print</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent slot="fixed">
          <IonList>
            <IonItem>
              <IonLabel>Printer</IonLabel>
              <IonSelect placeholder="Select Printer" onIonChange={((e) => this.onPrinterChanged((e.target as HTMLInputElement).value))}>
                <IonSelectOption value="e47fb2fdadba">PW208NX</IonSelectOption>
                <IonSelectOption value="e47fb2fda782">PW208NX Firma</IonSelectOption>
                <IonSelectOption value="00182f9d469e">PC23D</IonSelectOption>
                <IonSelectOption value="f0a3b253c3eb">PC23D Firma</IonSelectOption>
                <IonSelectOption value="0017E90651FF">PC23D Firma II</IonSelectOption>
                <IonSelectOption value="0017E90B6BA6">PC23D Mark</IonSelectOption>
                <IonSelectOption value="00182f9d4c9b">PC23D Seb</IonSelectOption>
                <IonSelectOption value="000190ec07e9">MB200i</IonSelectOption>
                <IonSelectOption value="000190e6b756">MB200i (2)</IonSelectOption>
                <IonSelectOption value="000190ec15a7">MB200i Firma</IonSelectOption>
              </IonSelect>
            </IonItem>
          </IonList>
          <IonButton onClick={() => this.discover()}>Discover</IonButton>
          <IonButton onClick={() => this.connectToPrinter(this.barcodevalue)}>Connect</IonButton>
          <IonButton onClick={() => this.getStatus()}>Get Printer Status</IonButton>
          <IonButton onClick={() => this.setMediaSize(46, 37)}>Set Media Size</IonButton>
          <IonButton onClick={() => this.print('label22.dat')}>Print Label</IonButton>
          <IonInput onIonChange={(e: any) => this.setState({ label: e.target.value})}></IonInput>
          <IonButton onClick={() => this.printInput(this.state.label)}>Print Label</IonButton>
        </IonContent>
        <IonContent>
          <IonCard>
            <IonCardContent>
            <IonList>
                {this.state.devices.map((dev) => (
                  <IonItem onClick={() => this.connectToPrinter(dev.address)}><IonText>{dev.name} - {dev.address}</IonText></IonItem>
                ))}
              </IonList>
              <IonList>
                {this.state.statuslist.map((item) => (
                  <IonItem><IonText>{item}</IonText></IonItem>
                ))}
              </IonList>
            </IonCardContent>
          </IonCard>
        </IonContent>
        <IonFooter>
          <IonText>{this.state.status}</IonText>
        </IonFooter>
      </IonPage>
    );
  }
}

export default Home;