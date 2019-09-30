
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
	context->setHeader(result);
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

	//std::cout << "media name: " << context->_inFileName.c_str() << std::endl;
	try {
		if (!_frameRemuxer) {
			_frameRemuxer.reset(new FrameRemuxer(context->resource()));
		}
		auto remuxed = _frameRemuxer->remux();
		context->updatePts(remuxed.pts);
		return remuxed.frame;
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
	std::cout << "check, " << this << std::endl;
	QByteArray result = context->resource().remuxedOutput().close();
	int ret = av_write_trailer(context->resource().outputFormatContext());
	if (ret < 0) {
		throw EXCEPTION_MESSAGE(Exception, ret, "Error on writing trailer");
	}
	context->handleStreamEnd();
	context->changeState(new Idle);
	return result;
}

QByteArray Idle::remux(RemuxingContext* context)
{
	if (!context->_ended) {
		context->changeState(new HeaderGenerate);
	}
	return QByteArray();
}
