
#pragma once
#include <memory>
#include <QByteArray>

class RemuxingContext;
class FrameRemuxer;

class RemuxingState
{
public:
	// NOTE: subclass �� ������ ���ؼ� ���� ��
	virtual ~RemuxingState() {}
	// return : ������ remux�� �������� �ִ����� ����
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
