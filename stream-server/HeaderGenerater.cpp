#include "HeaderGenerater.h"
#include "RemuxedOutput.h"
#include "RemuxResourceContext.h"


void copyCodecParameter(AVCodecParameters* dst, AVCodecParameters* src)
{
	int ret = avcodec_parameters_copy(dst, src);
	if (ret < 0) {
		throw EXCEPTION_MESSAGE(Exception, ret, "Failed to copy codec parameters");
	}
	dst->codec_tag = 0;
}


void writeHeader(AVFormatContext* ofmtCtx)
{
	AVDictionary* outOptions = nullptr;
	// ret = av_dict_set(&outOptions, "fflags", "nobuffer", 0);
	// if (ret < 0) {
	// 	throw EXCEPTION_MESSAGE(Exception, ret, "Error on setting option for nobuffer");
	// }
	//
	// ret = av_dict_set(&outOptions, "flags", "low_delay", 0);
	// if (ret < 0) {
	// 	throw EXCEPTION_MESSAGE(Exception, ret, "Error on setting option for low delay");
	// }

	int ret = av_dict_set_int(&outOptions, "frag_duration", 7000, 0);
	if (ret < 0) {
		throw EXCEPTION_MESSAGE(Exception, ret, "Error on setting option for frag_duration");
	}

	ret = av_dict_set(&outOptions, "movflags", "frag_keyframe+empty_moov+default_base_moof", 0);
	if (ret < 0) {
		throw EXCEPTION_MESSAGE(Exception, ret, "Error on setting option for moov");
	}

	ret = avformat_write_header(ofmtCtx, &outOptions);
	if (ret < 0) {
		throw EXCEPTION_MESSAGE(Exception, ret, "Error occurred when opening output file");
	}
}

QByteArray getHeaderByteArray(AVFormatContext* ofmtCtx, RemuxedOutput& remuxedOut)
{
	//RemuxedOutput& remuxedOut = _resource.remuxedOutput();
	//remuxedOut.setSink(socket);
	if (!(ofmtCtx->flags & AVFMT_NOFILE)) {
		int ret = remuxedOut.open();

		if (ret < 0) {
			throw EXCEPTION_MESSAGE(Exception, ret, "Could not open remuxed output file");
		}
	}

	writeHeader(ofmtCtx);
	return remuxedOut.update();
}

#include <QElapsedTimer>
#include <iostream>
#include <QFile>

QByteArray HeaderGenerater::makeHeader(const char* in_filename)
{
	QElapsedTimer timer;
	timer.start();
	
	_resource.openInput(in_filename);
	AVFormatContext* ifmtCtx = _resource.inputFormatContext();
	int ret = 0;
	if ((ret = avformat_find_stream_info(ifmtCtx, 0)) < 0) {
		throw EXCEPTION_MESSAGE(Exception, ret, "Failed to retrieve input stream information");
	}
	av_dump_format(ifmtCtx, 0, in_filename, 0);

	_resource.allocOutputContext();

	_resource.allocStreamMapping();

	AVFormatContext* ofmtCtx = _resource.outputFormatContext();
	_ofmt = ofmtCtx->oformat;

	int* streamMapping = _resource.streamMapping();
	int stream_index = 0;
	for (int i = 0; i < ifmtCtx->nb_streams; i++) {
		AVStream* out_stream;
		AVStream* in_stream = ifmtCtx->streams[i];
		AVCodecParameters* in_codecpar = in_stream->codecpar;
		if (in_codecpar->codec_type != AVMEDIA_TYPE_AUDIO &&
			in_codecpar->codec_type != AVMEDIA_TYPE_VIDEO &&
			in_codecpar->codec_type != AVMEDIA_TYPE_SUBTITLE
			) {
			streamMapping[i] = -1;
			continue;
		}
		
		streamMapping[i] = stream_index++;

		out_stream = avformat_new_stream(ofmtCtx, nullptr);
		if (!out_stream) {
			throw EXCEPTION_MESSAGE(Exception, ret, "Failed allocating output stream");
		}
		
		if (in_codecpar->codec_type == AVMEDIA_TYPE_AUDIO) {
			bool needTranscoding = _resource.allocTranscodingResources(in_codecpar, out_stream);
			if (!needTranscoding) {
				copyCodecParameter(out_stream->codecpar, in_codecpar);
			}
		} else {
			copyCodecParameter(out_stream->codecpar, in_codecpar);
		}		
	}
	
	_resource.assignRemuxedOutput();


	
	auto result = getHeaderByteArray(ofmtCtx, _resource.remuxedOutput());

	// static int tempIndex = 0;
	// QFile outMp4(QString("out%1.mp4").arg(tempIndex));
	// outMp4.open(QFile::WriteOnly);
	// outMp4.write(result);
	// tempIndex++;
	
	std::cout << "elapased on header:" << timer.elapsed() << std::endl;
	return result;
}
