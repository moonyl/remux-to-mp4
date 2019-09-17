
#include "remuxStreamToMP4.h"

extern "C" {
#include <libavformat/avformat.h>
	void log_packet(const AVFormatContext* fmt_ctx, const AVPacket* pkt, const char* tag);
	char* av_error2char(int errorNum);
}

#include "RemuxedOutput.h"
#include <basekit/Exception.h> 
#include "RemuxIntermediate.h"
#include <iostream>
namespace remuxToMp4 {
	
	void generateHeader(RemuxIntermediate& intm, const char* in_filename, QWebSocket* socket)
	{
		int stream_index = 0;

		AVDictionary* inOptions = NULL;
		int rc = av_dict_set(&inOptions, "rtsp_transport", "tcp", 0);
		//rc = av_dict_set(&options, "allowed_media_types", "video", 0);
		rc = av_dict_set(&inOptions, "fflags", "nobuffer", 0);
		rc = av_dict_set(&inOptions, "flags", "low_delay", 0);

		int ret;
		if ((ret = avformat_open_input(&intm.ifmt_ctx, in_filename, nullptr, &inOptions)) < 0) {
			throw EXCEPTION_MESSAGE(Exception, ret, "Could not open input file");
		}

		av_dict_free(&inOptions);

		if ((ret = avformat_find_stream_info(intm.ifmt_ctx, 0)) < 0) {
			throw EXCEPTION_MESSAGE(Exception, ret, "Failed to retrieve input stream information");
		}
		av_dump_format(intm.ifmt_ctx, 0, in_filename, 0);

		avformat_alloc_output_context2(&intm.ofmt_ctx, NULL, "mp4", nullptr);
		if (!intm.ofmt_ctx) {
			throw EXCEPTION_MESSAGE(Exception, ret, "Could not create output context");
		}
		int stream_mapping_size = intm.ifmt_ctx->nb_streams;
		intm.stream_mapping = static_cast<int*>(av_mallocz_array(stream_mapping_size, sizeof(*intm.stream_mapping)));
		if (!intm.stream_mapping) {
			throw EXCEPTION_MESSAGE(Exception, ret, "Failed stream mapping");
		}
		intm.ofmt = intm.ofmt_ctx->oformat;
		for (int i = 0; i < intm.ifmt_ctx->nb_streams; i++) {
			AVStream* out_stream;
			AVStream* in_stream = intm.ifmt_ctx->streams[i];
			AVCodecParameters* in_codecpar = in_stream->codecpar;
						
			if (in_codecpar->codec_type != AVMEDIA_TYPE_AUDIO &&
				in_codecpar->codec_type != AVMEDIA_TYPE_VIDEO &&
				in_codecpar->codec_type != AVMEDIA_TYPE_SUBTITLE) {
				intm.stream_mapping[i] = -1;
				continue;
			}
			intm.stream_mapping[i] = stream_index++;
			out_stream = avformat_new_stream(intm.ofmt_ctx, NULL);
			if (!out_stream) {
				throw EXCEPTION_MESSAGE(Exception, ret, "Failed allocating output stream");
			}
			ret = avcodec_parameters_copy(out_stream->codecpar, in_codecpar);
			if (ret < 0) {
				throw EXCEPTION_MESSAGE(Exception, ret, "Failed to copy codec parameters");
			}
			out_stream->codecpar->codec_tag = 0;
		}

		intm.remuxedOut.setPb(&intm.ofmt_ctx->pb);
		intm.remuxedOut.setSink(socket);
		if (!(intm.ofmt->flags & AVFMT_NOFILE)) {
			ret = intm.remuxedOut.open();

			if (ret < 0) {
				throw EXCEPTION_MESSAGE(Exception, ret, "Could not open remuxed output file");
			}
		}


		AVDictionary* outOptions = nullptr;
		av_dict_set(&outOptions, "movflags", "frag_keyframe+empty_moov+default_base_moof", 0);
		ret = avformat_write_header(intm.ofmt_ctx, &outOptions);
		if (ret < 0) {
			throw EXCEPTION_MESSAGE(Exception, ret, "Error occurred when opening output file");
		}

		intm.remuxedOut.update();
	}
	
	
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
	
	void remuxFrame(RemuxIntermediate& intm, AVPacket& pkt, double& startPts)
	{
		AVStream* in_stream = nullptr;
		if (readStream(intm.ifmt_ctx, intm.stream_mapping, pkt, in_stream) != 0) {
			return;
		}

		remuxStream(intm.ofmt_ctx, in_stream, pkt, startPts);

		writeStream(intm.ofmt_ctx, intm.remuxedOut, pkt);
	}
	
	// int remuxStreamToMP4WithClass(const char* in_filename, QWebSocket* socket)
	// {
	// 	int ret = 0;
	// 	RemuxResourceContext resource;
	// 	HeaderGenerater generater(resource);
	// 	try {			
	// 		generater.makeHeader(in_filename, socket);
	// 		FrameRemuxer remuxer(resource);
	// 		try {
	// 			while (true) {
	// 				remuxer.remux();
	// 			}
	// 		}
	// 		catch (Exception e) {
	// 			av_write_trailer(resource.outputFormatContext());
	// 			throw;
	// 		}
	// 		
	// 	}
	// 	catch (Exception& e) {
	// 		ret = e.error();
	// 	}
	// 	catch (...) {
	//
	// 	}
	//
	// 	return ret;
	// }
	
	int remuxStreamToMP4(const char* in_filename, QWebSocket* socket)
	{
		int ret = 0;

		RemuxIntermediate intm;

		try {
			AVPacket pkt;

			generateHeader(intm, in_filename, socket);

			intm.ofmt = intm.ofmt_ctx->oformat;

			double startPts = -1;
			try {
				while (1) {
					remuxFrame(intm, pkt, startPts);
				}
			}
			catch (Exception e) {
				av_write_trailer(intm.ofmt_ctx);
				throw;
			}
		}
		catch (Exception& e) {
			ret = e.error();
		}
		catch (...) {

		}

		avformat_close_input(&intm.ifmt_ctx);
		/* close output */
		if (intm.ofmt_ctx && !(intm.ofmt->flags & AVFMT_NOFILE)) {
			intm.remuxedOut.close();
		}

		avformat_free_context(intm.ofmt_ctx);
		av_freep(&intm.stream_mapping);
		if (ret < 0 && ret != AVERROR_EOF) {
			fprintf(stderr, "Error occurred: %s\n", av_error2char(ret));
			return 1;
		}

		return 0;
	}
}