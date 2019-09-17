
#pragma once

extern "C" {
#include <libavformat/avformat.h>
}

class QWebSocket;
struct RemuxIntermediate;
class RemuxedOutput;

namespace remuxToMp4 {
	int remuxStreamToMP4WithClass(const char* in_filename, QWebSocket* socket);
	int remuxStreamToMP4(const char* in_filename, QWebSocket* socket = nullptr);
	
	void generateHeader(RemuxIntermediate& intm, const char* in_filename, QWebSocket* socket);
	int readStream(AVFormatContext* ifmt_ctx, int* stream_mapping, AVPacket& pkt, AVStream*& in_stream);
	void remuxStream(AVFormatContext* ofmt_ctx, AVStream* in_stream, AVPacket& pkt, double& startPts);
	void writeStream(AVFormatContext* ofmt_ctx, RemuxedOutput& remuxedOut, AVPacket& pkt);
	void remuxFrame(RemuxIntermediate& intm, AVPacket& pkt, double& startPts);
}