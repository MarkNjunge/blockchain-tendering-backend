export class Document {
  name: string;
  ref: string;
  hash: string;
  data: Buffer;

  constructor(name: string, ref: string, hash: string, data: Buffer) {
    this.name = name;
    this.ref = ref;
    this.hash = hash;
    this.data = data;
  }
}
