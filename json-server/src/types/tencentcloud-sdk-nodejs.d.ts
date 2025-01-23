declare module 'tencentcloud-sdk-nodejs' {
  export namespace sms {
    export namespace v20210111 {
      export class Client {
        constructor(config: any);
        SendSms(params: any): Promise<any>;
      }
    }
  }
} 