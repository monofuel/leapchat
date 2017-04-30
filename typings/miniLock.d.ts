
interface KeyPairType {
  secretKey: string;
  publicKey: string;
}

interface CryptoType {
    encryptFile: (blob: Blob, name: string, arr: string[], mID: string, secretKey: string, callback: (blob: Blob, saveName: string, senderID: string) => void) => void;
    decryptFile: (msg: Blob, mID: string, key: string, callback: (blob: Blob, saveName: string, senderID: string) => void) => void;
    getKeyPair: any;
    getMiniLockID: any;
}

interface MiniLock {
    crypto: CryptoType;
    session: any;
}

declare const miniLock: MiniLock;