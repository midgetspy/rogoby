# Rogoby

A WLED UI supplement for users with 1D installations (eg. Christmas lights or permanent soffit lighting).

## Why does this exist?

I use WLED for my Christmas lights. My roofline can be separated into 3 or 4 different sections depending on how
I want it to look.

I mostly use static repeating color patterns, which are achievable in WLED by having segments with spacing and
interleaving them with different start points. On the peak of my roof I like to have the pattern symmetrical on both
sides, which adds to the complexity of setting up the segments in WLED.

Sometimes I want part of my house to play an effect while the rest has a pattern, and sometimes I want to show
different patterns on different parts of my house. This results in a lot of messing around with segments and saving tons of presets for every possible combination of patterns and effects on different parts of my house.

Rogoby is my solution to this complexity. It's a simple UI that can be used to create arbitrary patterns and apply them
(with reverse/mirror support) to different parts of my LED string with minimal effort.

## What does it do?

* Creates the concept of "Sections", which represent a physical section of your LED string (like a WLED segment without grouping/spacing)
* Separates effect presets from section presets, which can then be combined later
* Adds some "virtual" effects for effects which WLED doesn't support directly (like arbitrary repeating patterns)

## How to run it

Get the docker image and start it:

- mount a config folder in /app/config
- specify your WLED IP address in an environment variable named WLED_IP
- expose port 3000

An example docker-compose config:

```yaml
version: "3.8"
services:
  rogoby:
    image: midgetspy/rogoby:latest
    ports:
      - 8030:3000/tcp
    volumes:
      - /my/config/dir:/app/config
    environment:
      - WLED_IP=192.168.0.123
```

The web interface will be served up on the port you specified.

## How to use it

First, create section presets for the different ways you may want to break up your LED string:
* Sections are continuous (no gaps between them)

Second, create effect presets for the different things you want to display on your LEDs:
* Virtual effects will be converted to multiple segments in WLED
* WLED effects can be imported by configuring WLED with the effect you want then importing it into an effect in Rogoby with the "Import from WLED" button

Third, combine them to configure your LEDs the way you want:
* Choose a section preset
* For each section in the preset, choose an effect preset
* Apply to WLED. If you want, go to WLED and save the preset there once it's applied

## Limitations

* UI is barely usable and extremely ugly
* No security features (vulnerable to basically every attack you can think of)
