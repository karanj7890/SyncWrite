package websocket

import (
	"bytes"
	"encoding/binary"
)

const (
	// y-protocols top-level message type for sync traffic.
	messageSync = 0
	// y-protocols sync sub-message for a document update.
	syncMessageUpdate = 2
	// y-protocols sync sub-message for a full document state reply.
	syncMessageStep2 = 1

	snapshotMagic = "YLOG1"
)

// EncodeSyncStep2 wraps a raw Yjs state update in the y-websocket wire format.
//
// The browser client expects:
//
//	top-level message type 0 (sync)
//	inner sync message type 1 (SyncStep2)
//	payload buffer containing the Yjs update bytes
func EncodeSyncStep2(update []byte) []byte {
	return encodeSyncMessage(syncMessageStep2, update)
}

// EncodeSyncUpdate wraps a Yjs update payload in a sync message.
func EncodeSyncUpdate(update []byte) []byte {
	return encodeSyncMessage(syncMessageUpdate, update)
}

func encodeSyncMessage(innerType byte, payload []byte) []byte {
	var buf bytes.Buffer
	writeVarUint(&buf, messageSync)
	writeVarUint(&buf, uint64(innerType))
	writeVarBuffer(&buf, payload)
	return buf.Bytes()
}

// EncodeSnapshotLog stores one or more raw Yjs update payloads in a simple
// framed format so the room can persist a document history without needing a
// Yjs implementation on the server.
func EncodeSnapshotLog(updates [][]byte) []byte {
	var buf bytes.Buffer
	_, _ = buf.WriteString(snapshotMagic)
	writeVarUint(&buf, uint64(len(updates)))
	for _, update := range updates {
		writeVarBuffer(&buf, update)
	}
	return buf.Bytes()
}

// DecodeSnapshotLog returns the framed update payloads if the blob is in the
// server-owned log format. Otherwise it returns false so legacy raw snapshots
// can still be handled.
func DecodeSnapshotLog(blob []byte) ([][]byte, bool) {
	if len(blob) < len(snapshotMagic) || string(blob[:len(snapshotMagic)]) != snapshotMagic {
		return nil, false
	}
	offset := len(snapshotMagic)
	count, n := binary.Uvarint(blob[offset:])
	if n <= 0 {
		return nil, false
	}
	offset += n
	updates := make([][]byte, 0, count)
	for i := uint64(0); i < count; i++ {
		update, next, ok := readVarBuffer(blob[offset:])
		if !ok {
			return nil, false
		}
		offset += next
		updates = append(updates, update)
	}
	if offset != len(blob) {
		return nil, false
	}
	return updates, true
}

func ExtractSyncUpdate(msg []byte) ([]byte, bool) {
	messageType, n := binary.Uvarint(msg)
	if n <= 0 || messageType != messageSync {
		return nil, false
	}
	innerType, m := binary.Uvarint(msg[n:])
	if m <= 0 || innerType != syncMessageUpdate {
		return nil, false
	}
	update, _, ok := readVarBuffer(msg[n+m:])
	if !ok {
		return nil, false
	}
	return update, true
}

func writeVarUint(buf *bytes.Buffer, n uint64) {
	var scratch [10]byte
	written := binary.PutUvarint(scratch[:], n)
	_, _ = buf.Write(scratch[:written])
}

func writeVarBuffer(buf *bytes.Buffer, data []byte) {
	writeVarUint(buf, uint64(len(data)))
	_, _ = buf.Write(data)
}

func readVarBuffer(data []byte) ([]byte, int, bool) {
	n, read := binary.Uvarint(data)
	if read <= 0 {
		return nil, 0, false
	}
	start := read
	end := start + int(n)
	if end > len(data) {
		return nil, 0, false
	}
	out := make([]byte, int(n))
	copy(out, data[start:end])
	return out, end, true
}
