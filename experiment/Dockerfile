FROM ubuntu:24.04

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
       openssh-server ca-certificates python3 \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --shell /bin/bash agent \
    && mkdir -p /run/sshd /home/agent/workspace /home/agent/.ssh \
    && chown -R agent:agent /home/agent \
    && chmod 700 /home/agent/.ssh

COPY entrypoint.sh /usr/local/bin/mini-agent-entrypoint
RUN chmod 755 /usr/local/bin/mini-agent-entrypoint

EXPOSE 22
ENTRYPOINT ["/usr/local/bin/mini-agent-entrypoint"]
