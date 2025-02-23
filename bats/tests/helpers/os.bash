UNAME=$(uname)
ARCH=$(uname -m)

case $UNAME in
Darwin)
    # OS matches the directory name of the PATH_RESOURCES directory,
    # so uses "darwin" and not "macos".
    OS=darwin
    ;;
Linux)
    if [[ $(uname -a) =~ microsoft ]]; then
        OS=windows
    else
        OS=linux
    fi
    ;;
*)
    echo "Unexpected uname: $UNAME" >&2
    exit 1
    ;;
esac

is_linux() {
    if [ -z "${1-}" ]; then
        test "$OS" = linux
    else
        test "$OS" = linux -a "$ARCH" = "$1"
    fi
}
is_macos() {
    if [ -z "${1-}" ]; then
        test "$OS" = darwin
    else
        test "$OS" = darwin -a "$ARCH" = "$1"
    fi
}
is_windows() {
    if [ -z "${1-}" ]; then
        test "$OS" = windows
    else
        test "$OS" = windows -a "$ARCH" = "$1"
    fi
}
is_unix() {
    ! is_windows "$@"
}
