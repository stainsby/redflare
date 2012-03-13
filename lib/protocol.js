function readInt(buf, offset) {
  var ch1 = buf.readInt8(offset);
  var result;
  if (ch1 == -128) {
    result = [buf.readInt16LE(offset + 1), offset + 3];
  } else if (ch1 == -127) {
    result = [buf.readInt32LE(offset + 1), offset + 5];
  }
  else {
    result = [ch1, offset + 1];
  }
  return result;
}


function readString(buf, offset) {
  var start = offset;
  var end = start;
  while (buf[end] != 0 && end < buf.length) {
    end++;
  }
  return [buf.toString('ascii', start, end), end + 1]; // TODO
}


function Stream(buffer, offset) {
  this.buffer = buffer;
  this.offset = offset;
  this.readNextInt = function() {
    var next = readInt(this.buffer, this.offset);
    this.offset = next[1];
    return next[0];
  }
  this.readNextString = function() {
    var next = readString(this.buffer, this.offset);
    this.offset = next[1];
    return next[0];
  }
}


if (typeof exports == 'object') {
  exports.Stream = Stream;
}
