
#pragma once
#include <memory>

class RemuxingContext;
class FrameRemuxer;

class RemuxingState
{
public:
	// return : 다음에 remux할 프레임이 있는지의 여부
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
