
#pragma once

extern "C" {
	#include <libavformat/avformat.h>
}
#include <string>
#include <QWebSocket>

class RemuxedOutputStrategy
{
public:
	RemuxedOutputStrategy(AVIOContext** pb)  : _pb(pb) {}
	virtual int open() = 0;
	virtual QByteArray update() = 0;
	virtual QByteArray close() = 0;
	// TODO: QWebSocket의 abstraction이 필요하다.
	//virtual void setSink(QWebSocket* socket) {}

protected:
	AVIOContext** _pb;
};

#include <QWebSocket>
class DynBufferOutputStrategy : public RemuxedOutputStrategy
{
	//QWebSocket* _socket;
public:
	DynBufferOutputStrategy(AVIOContext** pb, QWebSocket* socket) : RemuxedOutputStrategy(pb)//, _socket(socket)
	{
		
	}
	
	int open()
	{
		return avio_open_dyn_buf(_pb);
	}
	
	QByteArray update()
	{
		uint8_t* buf;
		int bufSize = avio_get_dyn_buf(*_pb, &buf);
		if (bufSize) {
			int dynBufSize = avio_close_dyn_buf(*_pb, &buf);

			QByteArray result((const char*)buf, bufSize);
			// if (_socket) {
			// 	_socket->sendBinaryMessage(QByteArray((const char*)buf, bufSize));
			// }

			av_freep(&buf);

			*_pb = nullptr;
			int ret = avio_open_dyn_buf(_pb);
			if (ret < 0) {
				fprintf(stderr, "Error occurred when opening output file\n");
			}
			return result;
		}
		return QByteArray();
	}
	
	QByteArray close()
	{
		uint8_t* buf;
		int bufSize = avio_get_dyn_buf(*_pb, &buf);
		if (bufSize) {
			int dynBufSize = avio_close_dyn_buf(*_pb, &buf);

			QByteArray result((const char*)buf, bufSize);

			av_freep(&buf);
			*_pb = nullptr;

			return result;
		}
		return QByteArray();
	}

};

class AvioOutputStrategy : public RemuxedOutputStrategy
{
public:
	AvioOutputStrategy(AVIOContext** pb) : RemuxedOutputStrategy(pb)
	{
		
	}

	int open()
	{
		return avio_open(_pb, "result.mp4", AVIO_FLAG_WRITE);
	}
	
	QByteArray update()
	{
		return QByteArray();
		// nothing to do
	}
	
	QByteArray close()
	{		
		avio_closep(_pb);
		return QByteArray();
	}
};

#include <memory>
class RemuxedOutput
{	
	bool _useDynBuf = true;
	std::unique_ptr<RemuxedOutputStrategy> _outputHandler;

public:
	RemuxedOutput(bool useDynBuf = true) : _useDynBuf(useDynBuf)
	{
	}

	void setPb(AVIOContext** pb, QWebSocket* socket = nullptr)
	{
		if (_useDynBuf) {
			_outputHandler.reset(new DynBufferOutputStrategy(pb, socket));
			return;
		}
		
		_outputHandler.reset(new AvioOutputStrategy(pb));		
	}

	int open()
	{
		return _outputHandler->open();
	}

	QByteArray update()
	{
		return _outputHandler->update();
	}

	QByteArray close()
	{
		return _outputHandler->close();
	}
};