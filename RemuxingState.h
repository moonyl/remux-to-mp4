
#pragma once
#include <memory>

class RemuxingContext;
class FrameRemuxer;

class RemuxingState
{
public:
	// return : ������ remux�� �������� �ִ����� ����
	virtual bool remux(RemuxingContext* context) = 0;
};


class HeaderGenerate : public RemuxingState
{
public:
	bool remux(RemuxingContext* context);
};

class RemuxStream : public RemuxingState
{
	std::unique_ptr<FrameRemuxer> _frameRemuxer;
	
public:
	bool remux(RemuxingContext* context);
};

class TrailerWrite : public RemuxingState
{
public:
	bool remux(RemuxingContext* context);
};

class ResourceRelease : public RemuxingState
{
public:
	bool remux(RemuxingContext* context);
};
