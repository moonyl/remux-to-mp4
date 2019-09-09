/*
 * Copyright (c) 2013 Stefano Sabatini
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
/**
 * @file
 * libavformat/libavcodec demuxing and muxing API example.
 *
 * Remux streams from one container format to another.
 * @example remuxing.c
 */
 extern "C" {
#include <libavutil/timestamp.h>
#include <libavformat/avformat.h>
void log_packet(const AVFormatContext *fmt_ctx, const AVPacket *pkt, const char *tag);
char* av_error2char(int errorNum);
}

#include <string>
 class RemuxedOutput
 {
	 std::string _fileName;
	 bool _useDynBuf = true;
	 AVIOContext** _pb;

 public:
	 RemuxedOutput(bool useDynBuf) : _useDynBuf(useDynBuf)
	 {
		 if(!useDynBuf) {
			 _fileName = "result.mp4";
		 }
	 }

 	void setPb(AVIOContext** pb)
	 {
		_pb = pb;
	 }
 	
	 int open()
	 {
		 int ret;
		 if (_useDynBuf) {
			 ret = avio_open_dyn_buf(_pb);
		 }
		 else {
			 ret = avio_open(_pb, _fileName.c_str(), AVIO_FLAG_WRITE);
		 }
		 return ret;
	 }

 	void update()
	 {
		 if (_useDynBuf) {
			 uint8_t* buf;
			 int bufSize = avio_get_dyn_buf(*_pb, &buf);
			 if (bufSize) {
				 int dynBufSize = avio_close_dyn_buf(*_pb, &buf);

				 // TODO : write file or stream

				 av_freep(&buf);

				 *_pb = nullptr;
				 int ret = avio_open_dyn_buf(_pb);
				 if (ret < 0) {
					 fprintf(stderr, "Error occurred when opening output file\n");					 
				 }
			 }
		 }
	 }

 	void close()
	 {
		if (_useDynBuf) {
			uint8_t* buf;
			int bufSize = avio_get_dyn_buf(*_pb, &buf);
			if (bufSize) {
				int dynBufSize = avio_close_dyn_buf(*_pb, &buf);

				// TODO : write file or stream

				av_freep(&buf);
				*_pb = nullptr;
			}
		}
		else {
			avio_closep(_pb);
		}
	 }
 };
 
int main(int argc, char **argv)
{
    AVOutputFormat *ofmt = NULL;
    AVFormatContext *ifmt_ctx = NULL, *ofmt_ctx = NULL;
    AVPacket pkt;
    const char *in_filename, *out_filename;
    int ret, i;
    int stream_index = 0;
    int *stream_mapping = NULL;
    int stream_mapping_size = 0;

    //in_filename  = "rtsp://admin:q1w2e3r4@@192.168.15.109:554/profile3/media.smp";
	in_filename = "rtsp://192.168.15.11/Apink_I'mSoSick_720_2000kbps.mp4";
	out_filename = "sosick.mp4";

	RemuxedOutput remuxedOut(false);
	
	AVDictionary* inOptions = NULL;
	int rc = av_dict_set(&inOptions, "rtsp_transport", "tcp", 0);
	//rc = av_dict_set(&options, "allowed_media_types", "video", 0);
	rc = av_dict_set(&inOptions, "fflags", "nobuffer", 0);
	rc = av_dict_set(&inOptions, "flags", "low_delay", 0);
 	
    if ((ret = avformat_open_input(&ifmt_ctx, in_filename, nullptr, &inOptions)) < 0) {
	//if ((ret = avformat_open_input(&ifmt_ctx, in_filename, nullptr, nullptr)) < 0) {
        fprintf(stderr, "Could not open input file '%s'", in_filename);
        goto end;
    }

	av_dict_free(&inOptions);
 	
    if ((ret = avformat_find_stream_info(ifmt_ctx, 0)) < 0) {
        fprintf(stderr, "Failed to retrieve input stream information");
        goto end;
    }
    av_dump_format(ifmt_ctx, 0, in_filename, 0);

    //avformat_alloc_output_context2(&ofmt_ctx, NULL, NULL, out_filename);
	avformat_alloc_output_context2(&ofmt_ctx, NULL, "mp4", nullptr);
    if (!ofmt_ctx) {
        fprintf(stderr, "Could not create output context\n");
        ret = AVERROR_UNKNOWN;
        goto end;
    }
    stream_mapping_size = ifmt_ctx->nb_streams;
    stream_mapping = static_cast<int *>(av_mallocz_array(stream_mapping_size, sizeof(*stream_mapping)));
    if (!stream_mapping) {
        ret = AVERROR(ENOMEM);
        goto end;
    }
    ofmt = ofmt_ctx->oformat;
    for (i = 0; i < ifmt_ctx->nb_streams; i++) {
        AVStream *out_stream;
        AVStream *in_stream = ifmt_ctx->streams[i];
        AVCodecParameters *in_codecpar = in_stream->codecpar;
        if (in_codecpar->codec_type != AVMEDIA_TYPE_AUDIO &&
            in_codecpar->codec_type != AVMEDIA_TYPE_VIDEO &&
            in_codecpar->codec_type != AVMEDIA_TYPE_SUBTITLE) {
            stream_mapping[i] = -1;
            continue;
        }
        stream_mapping[i] = stream_index++;
        out_stream = avformat_new_stream(ofmt_ctx, NULL);
        if (!out_stream) {
            fprintf(stderr, "Failed allocating output stream\n");
            ret = AVERROR_UNKNOWN;
            goto end;
        }
        ret = avcodec_parameters_copy(out_stream->codecpar, in_codecpar);
        if (ret < 0) {
            fprintf(stderr, "Failed to copy codec parameters\n");
            goto end;
        }
        out_stream->codecpar->codec_tag = 0;
    }
    av_dump_format(ofmt_ctx, 0, out_filename, 1);

	remuxedOut.setPb(&ofmt_ctx->pb);
    if (!(ofmt->flags & AVFMT_NOFILE)) {
		ret = remuxedOut.open();
// #if 0    	
//         ret = avio_open(&ofmt_ctx->pb, out_filename, AVIO_FLAG_WRITE);
// #else
// 		ret = avio_open_dyn_buf(&ofmt_ctx->pb);
// #endif
        if (ret < 0) {
            fprintf(stderr, "Could not open output file '%s'", out_filename);
            goto end;
        }
    }

	//ret = avio_open_dyn_buf(&ofmt_ctx->pb);
	AVDictionary* outOptions = nullptr;
	av_dict_set(&outOptions, "movflags", "frag_keyframe+empty_moov+default_base_moof", 0);
	ret = avformat_write_header(ofmt_ctx, &outOptions);
    //ret = avformat_write_header(ofmt_ctx, NULL);
	if (ret < 0) {
		fprintf(stderr, "Error occurred when opening output file\n");
		goto end;
	}

	remuxedOut.update();
	// uint8_t* buf;
	// int bufSize = avio_get_dyn_buf(ofmt_ctx->pb, &buf); 	
	// if (bufSize) {
	// 	int dynBufSize = avio_close_dyn_buf(ofmt_ctx->pb, &buf);
	//
	// 	// TODO : write file or stream
	// 	
	// 	av_freep(&buf);
	// 	
	// 	ofmt_ctx->pb = nullptr;
	// 	int ret = avio_open_dyn_buf(&ofmt_ctx->pb);
	// 	if (ret < 0) {
	// 		fprintf(stderr, "Error occurred when opening output file\n");
	// 		goto end;
	// 	}
	// 	
	// }
 	
	double startPts = -1;
    while (1) {
        AVStream *in_stream, *out_stream;    	
        ret = av_read_frame(ifmt_ctx, &pkt);
        if (ret < 0)
            break;

        in_stream  = ifmt_ctx->streams[pkt.stream_index];
        if (pkt.stream_index >= stream_mapping_size ||
            stream_mapping[pkt.stream_index] < 0) {
            av_packet_unref(&pkt);
            continue;
        }
        pkt.stream_index = stream_mapping[pkt.stream_index];
        out_stream = ofmt_ctx->streams[pkt.stream_index];

		log_packet(ifmt_ctx, &pkt, "in");
    	
        /* copy packet */
        pkt.pts = av_rescale_q_rnd(pkt.pts, in_stream->time_base, out_stream->time_base, (AVRounding)(AV_ROUND_NEAR_INF|AV_ROUND_PASS_MINMAX));
        pkt.dts = av_rescale_q_rnd(pkt.dts, in_stream->time_base, out_stream->time_base, (AVRounding)(AV_ROUND_NEAR_INF|AV_ROUND_PASS_MINMAX));
        pkt.duration = av_rescale_q(pkt.duration, in_stream->time_base, out_stream->time_base);
        pkt.pos = -1;

        log_packet(ofmt_ctx, &pkt, "out");
		if (startPts < 0) {
			startPts = av_q2d(in_stream->time_base) * pkt.pts;
		}
		if (av_q2d(in_stream->time_base) * pkt.pts - startPts > 5.0) {
			av_packet_unref(&pkt);
			break;
		}
        ret = av_interleaved_write_frame(ofmt_ctx, &pkt);
        if (ret < 0) {
            fprintf(stderr, "Error muxing packet\n");
            break;
        }

		av_packet_unref(&pkt);

		remuxedOut.update();
		// uint8_t* buf;
		// int bufSize = avio_get_dyn_buf(ofmt_ctx->pb, &buf);
		// if (bufSize) {
		// 	int dynBufSize = avio_close_dyn_buf(ofmt_ctx->pb, &buf);
		//
		// 	// TODO : write file or stream
		//
		// 	av_freep(&buf);
		//
		// 	ofmt_ctx->pb = nullptr;
		// 	
		// 	int ret = avio_open_dyn_buf(&ofmt_ctx->pb);
		// 	if (ret < 0) {
		// 		fprintf(stderr, "Error occurred when opening output file\n");
		// 		goto end;
		// 	}
		//
		// }       
    }
    av_write_trailer(ofmt_ctx);
	
end:
    avformat_close_input(&ifmt_ctx);
    /* close output */
	if (ofmt_ctx && !(ofmt->flags & AVFMT_NOFILE)) {
		remuxedOut.close();
	}
#if 0
        avio_closep(&ofmt_ctx->pb);
#else
	{
	
		// uint8_t* buf;
		// int bufSize = avio_get_dyn_buf(ofmt_ctx->pb, &buf);
		// if (bufSize) {
		// 	int dynBufSize = avio_close_dyn_buf(ofmt_ctx->pb, &buf);
		//
		// 	// TODO : write file or stream
		//
		// 	av_freep(&buf);
		//
		// 	ofmt_ctx->pb = nullptr;
		// }
	}
#endif
    avformat_free_context(ofmt_ctx);
    av_freep(&stream_mapping);
    if (ret < 0 && ret != AVERROR_EOF) {
        fprintf(stderr, "Error occurred: %s\n", av_error2char(ret));
        return 1;
    }
 		
    return 0;
}