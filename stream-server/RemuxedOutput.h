
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
	virtual void update() = 0;
	virtual void close() = 0;
	// TODO: QWebSocket의 abstraction이 필요하다.
	virtual void setSink(QWebSocket* socket) {}

protected:
	AVIOContext** _pb;
};

#include <QWebSocket>
class DynBufferOutputStrategy : public RemuxedOutputStrategy
{
	QWebSocket* _socket;
public:
	DynBufferOutputStrategy(AVIOContext** pb, QWebSocket* socket) : RemuxedOutputStrategy(pb), _socket(socket)
	{
		
	}
	
	int open()
	{
		return avio_open_dyn_buf(_pb);
	}
	
	void update()
	{
		uint8_t* buf;
		int bufSize = avio_get_dyn_buf(*_pb, &buf);
		if (bufSize) {
			int dynBufSize = avio_close_dyn_buf(*_pb, &buf);

			if (_socket) {
				_socket->sendBinaryMessage(QByteArray((const char*)buf, bufSize));
			}

			av_freep(&buf);

			*_pb = nullptr;
			int ret = avio_open_dyn_buf(_pb);
			if (ret < 0) {
				fprintf(stderr, "Error occurred when opening output file\n");
			}
		}
	}
	
	void close()
	{
		uint8_t* buf;
		int bufSize = avio_get_dyn_buf(*_pb, &buf);
		if (bufSize) {
			int dynBufSize = avio_close_dyn_buf(*_pb, &buf);

			if (_socket) {
				_socket->sendBinaryMessage(QByteArray((const char*)buf, bufSize));
			}

			av_freep(&buf);
			*_pb = nullptr;
		}
	}

	void setSink(QWebSocket* socket)
	{
		_socket = socket;
		QObject::connect(socket, &QWebSocket::disconnected, [this]()
			{
				_socket = nullptr;
			});
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
	
	void update()
	{
		// nothing to do
	}
	
	void close()
	{
		avio_closep(_pb);
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

	void setSink(QWebSocket* socket)
	{
		_outputHandler->setSink(socket);
	}

	int open()
	{
		return _outputHandler->open();
	}

	void update()
	{
		_outputHandler->update();
	}

	void close()
	{
		_outputHandler->close();
	}
};