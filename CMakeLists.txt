cmake_minimum_required(VERSION 3.14)
project(ffmpeg_remux)

set(CMAKE_CXX_STANDARD 14)

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

add_executable(ffmpeg_remux main.cpp utils.c)
target_link_libraries(ffmpeg_remux PRIVATE
        ${avformat_LIB}
        ${avutil_LIB}
        ${avcodec_LIB})
target_include_directories(ffmpeg_remux PRIVATE
        ${ffmpeg_INCLUDE_DIR})

target_compile_definitions(ffmpeg_remux PRIVATE __STDC_CONSTANT_MACROS)
