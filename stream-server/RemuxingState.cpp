
#include "RemuxingState.h"
#include "RemuxingContext.h"
#include "HeaderGenerater.h"
#include "FrameRemuxer.h"
#include <basekit/Exception.h>

#include <iostream>
QByteArray HeaderGenerate::remux(RemuxingContext* context)
{
	QByteArray result;
	try {
		HeaderGenerater generater(context->resource());
		//generater.makeHeader(context->_inFileName.c_str(), context->_socket);
		result = generater.makeHeader(context->_inFileName.c_str());
	} catch(Exception& e) {
		std::cout << "exception: " << qPrintable(e.message()) << std::endl;
		throw e;
	}
	context->changeState(new RemuxStream);
	return result;
	//return true;
}

QByteArray RemuxStream::remux(RemuxingContext* context)
{
	// if (_count < 10000* 25) {
	// 	_count++;
	// }
	// else {
	// 	std::cout << "next state" << std::endl;
	// 	context->changeState(new TrailerWrite);
	// }
	// return QByteArray();
	
	try {
		if (!_frameRemuxer) {
			_frameRemuxer.reset(new FrameRemuxer(context->resource()));
		}
		return _frameRemuxer->remux();
	} catch(Exception& e) {
		if (e.message() == "test finished") {
			context->changeState(new TrailerWrite);
			return QByteArray();
		}
	}
	return QByteArray();

}

QByteArray TrailerWrite::remux(RemuxingContext* context)
{
	QByteArray result = context->resource().remuxedOutput().close();
	int ret = av_write_trailer(context->resource().outputFormatContext());
	if (ret < 0) {
		throw EXCEPTION_MESSAGE(Exception, ret, "Error on writing trailer");
	}
	context->handleStreamEnd();
	return result;
}

// bool ResourceRelease::remux(RemuxingContext* context)
// {
// 	return false;
// }
