#include "FrameRemuxer.h"
#include "RemuxResourceContext.h"


int readStream(AVFormatContext* ifmt_ctx, int* stream_mapping, AVPacket& pkt, AVStream*& in_stream)
{
	int ret = av_read_frame(ifmt_ctx, &pkt);
	if (ret < 0)
		throw EXCEPTION_MESSAGE(Exception, ret, "av_read_frame error");

	in_stream = ifmt_ctx->streams[pkt.stream_index];
	int stream_mapping_size = ifmt_ctx->nb_streams;
	if (pkt.stream_index >= stream_mapping_size ||
		stream_mapping[pkt.stream_index] < 0) {
		av_packet_unref(&pkt);
		return 1;
	}
	pkt.stream_index = stream_mapping[pkt.stream_index];
	//log_packet(ifmt_ctx, &pkt, "in");
	return 0;
}

#include <iostream>
void remuxStream(AVFormatContext* ofmt_ctx, AVStream* in_stream, AVPacket& pkt, double& startPts)
{
	AVStream* out_stream = ofmt_ctx->streams[pkt.stream_index];


	/* copy packet */
	pkt.pts = av_rescale_q_rnd(pkt.pts, in_stream->time_base, out_stream->time_base, (AVRounding)(AV_ROUND_NEAR_INF | AV_ROUND_PASS_MINMAX));
	pkt.dts = av_rescale_q_rnd(pkt.dts, in_stream->time_base, out_stream->time_base, (AVRounding)(AV_ROUND_NEAR_INF | AV_ROUND_PASS_MINMAX));
	pkt.duration = av_rescale_q(pkt.duration, in_stream->time_base, out_stream->time_base);
	pkt.pos = -1;

	//log_packet(ofmt_ctx, &pkt, "out");
	if (startPts < 0) {
		startPts = av_q2d(in_stream->time_base) * pkt.pts;
		std::cout << "startPts = " << startPts << std::endl;
	}
	if (av_q2d(in_stream->time_base) * pkt.pts - startPts > 20.0) {
		av_packet_unref(&pkt);
		throw EXCEPTION_MESSAGE(Exception, 0, "test finished");
	}
}

void writeStream(AVFormatContext* ofmt_ctx, RemuxedOutput& remuxedOut, AVPacket& pkt)
{
	int ret = av_interleaved_write_frame(ofmt_ctx, &pkt);
	if (ret < 0) {
		throw EXCEPTION_MESSAGE(Exception, ret, "Error muxing packet");
	}

	av_packet_unref(&pkt);

	remuxedOut.update();
}

void FrameRemuxer::remux()
{
	AVFormatContext* ifmtCtx = _resource.inputFormatContext();
	AVFormatContext* ofmtCtx = _resource.outputFormatContext();
	RemuxedOutput& remuxedOut = _resource.remuxedOutput();
	int* streamMapping = _resource.streamMapping();

	AVStream* in_stream = nullptr;
	if (readStream(ifmtCtx, streamMapping, _pkt, in_stream) != 0) {
		return;
	}

	remuxStream(ofmtCtx, in_stream, _pkt, _startPts);	

	writeStream(ofmtCtx, remuxedOut, _pkt);
}
