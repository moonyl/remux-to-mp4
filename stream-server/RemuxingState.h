
#pragma once
#include <memory>
#include <QByteArray>

class RemuxingContext;
class FrameRemuxer;

class RemuxingState
{
public:
	// NOTE: subclass 의 해제를 위해서 들어가야 함
	virtual ~RemuxingState() {}
	// return : 다음에 remux할 프레임이 있는지의 여부
	virtual QByteArray remux(RemuxingContext* context) = 0;
};


class HeaderGenerate : public RemuxingState
{
public:
	QByteArray remux(RemuxingContext* context);
};

class RemuxStream : public RemuxingState
{
	std::unique_ptr<FrameRemuxer> _frameRemuxer;
	//int _count = 0;
public:
	QByteArray remux(RemuxingContext* context);
};

class TrailerWrite : public RemuxingState
{
public:
	QByteArray remux(RemuxingContext* context);
};
