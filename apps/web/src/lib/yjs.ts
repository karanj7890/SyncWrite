import * as Y from 'yjs'

const SNAPSHOT_MAGIC = 'YLOG1'

export function createYDoc(): Y.Doc {
  return new Y.Doc()
}

export function applyStoredYjsState(doc: Y.Doc, state: Uint8Array) {
  const snapshotMagic = new TextEncoder().encode(SNAPSHOT_MAGIC)
  const hasSnapshotLogHeader =
    state.length >= snapshotMagic.length &&
    snapshotMagic.every((byte, index) => state[index] === byte)

  if (!hasSnapshotLogHeader) {
    Y.applyUpdate(doc, state)
    return true
  }

  let offset = snapshotMagic.length
  const count = readVarUint(state, offset)
  if (!count) return false
  offset = count.nextOffset

  for (let i = 0; i < count.value; i += 1) {
    const buffer = readVarBuffer(state, offset)
    if (!buffer) return false
    offset = buffer.nextOffset
    Y.applyUpdate(doc, buffer.value)
  }

  return offset === state.length
}

function readVarUint(data: Uint8Array, offset: number) {
  let value = 0
  let shift = 0
  let currentOffset = offset

  while (currentOffset < data.length && shift < 35) {
    const byte = data[currentOffset]
    value |= (byte & 0x7f) << shift
    currentOffset += 1

    if ((byte & 0x80) === 0) {
      return { value, nextOffset: currentOffset }
    }

    shift += 7
  }

  return null
}

function readVarBuffer(data: Uint8Array, offset: number) {
  const length = readVarUint(data, offset)
  if (!length) return null

  const start = length.nextOffset
  const end = start + length.value
  if (end > data.length) return null

  return {
    value: data.slice(start, end),
    nextOffset: end,
  }
}
