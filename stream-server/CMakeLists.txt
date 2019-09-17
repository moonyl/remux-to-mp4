cmake_minimum_required(VERSION 3.14)
project(ffmpeg_remux)

set(CMAKE_CXX_STANDARD 14)

set(CMAKE_INCLUDE_CURRENT_DIR ON)
set(CMAKE_AUTOMOC ON)

set(FFMPEG_DEV_BASE "third-party/ffmpeg-20190826-0821bc4-win64")

find_library(avcodec_LIB avcodec.lib HINTS ${FFMPEG_DEV_BASE}/lib)
find_library(avdevice_LIB avdevice.lib HINTS ${FFMPEG_DEV_BASE}/lib)
find_library(avfilter_LIB avfilter.lib HINTS ${FFMPEG_DEV_BASE}/lib)
find_library(avformat_LIB avformat.lib HINTS ${FFMPEG_DEV_BASE}/lib)
find_library(avutil_LIB avutil.lib HINTS ${FFMPEG_DEV_BASE}/lib)
find_library(postproc_LIB postproc.lib HINTS ${FFMPEG_DEV_BASE}/lib)
find_library(swresample_LIB swresample.lib HINTS ${FFMPEG_DEV_BASE}/lib)
find_library(swscale_LIB swscale.lib HINTS ${FFMPEG_DEV_BASE}/lib)
find_path(ffmpeg_INCLUDE_DIR libavcodec/avcodec.h HINTS ${FFMPEG_DEV_BASE}/include)
message(STATUS ${ffmpeg_INCLUDE_DIR} "," ${swscale_LIB})

find_package(Qt5 COMPONENTS Core WebSockets Concurrent REQUIRED)
get_target_property(QtCore_location Qt5::Core LOCATION_Debug)
message(STATUS "QtCore_location=${QtCore_location}, ${CMAKE_BUILD_TYPE}")

set (KITS_ROOT F:/managed/kits)
find_library(basekit_LIB basekit.lib HINTS ${KITS_ROOT}/basekit/VS2017/x64/${CMAKE_BUILD_TYPE})
message(STATUS "HINT=${KITS_ROOT}/baskit/VS2017/x64/${CMAKE_BUILD_TYPE}")
message(STATUS basekit_LIB=${basekit_LIB})
find_path(kits_INCLUDE_DIR basekit/Exception.h HINTS ${KITS_ROOT})
message(STATUS kits_INCLUDE_DIR=${kits_INCLUDE_DIR})

add_executable(ffmpeg_remux 
	FrameRemuxer.cpp
	FrameRemuxer.h
	HeaderGenerater.cpp
	HeaderGenerater.h
	main.cpp 	
	Mp4RemuxManager.h
	RemuxedOutput.h	
	RemuxingContext.h		
	RemuxingState.cpp
	RemuxingState.h	
	RemuxIntermediate.h
	RemuxResourceContext.cpp
	RemuxResourceContext.h	
	remuxStreamToMP4.cpp
	remuxStreamToMP4.h	
	utils.c
	WebSocketServer.cpp
	WebSocketServer.h 	
	)

target_link_libraries(ffmpeg_remux PRIVATE
        ${avformat_LIB}
        ${avutil_LIB}
        ${avcodec_LIB}
		Qt5::Core
		Qt5::WebSockets
		Qt5::Concurrent
		${basekit_LIB} )

target_include_directories(ffmpeg_remux PRIVATE
        ${ffmpeg_INCLUDE_DIR}
		${kits_INCLUDE_DIR}
		)

target_compile_definitions(ffmpeg_remux PRIVATE __STDC_CONSTANT_MACROS)
