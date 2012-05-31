thumbs
======

A programming language for your thumbs

Compare with coffeescript

<table><tr><td>
## thumbs    
    #strings
    name is ' Drew LeSueur
    wife is 'Aimee

    #functions
    say-hi is fn name
      ' hello $name

    # one-line functions
    bang is f alert 'bang

    # closure
    inc-maker is fn
      x is 0
      f add x 1
    inc is inc-maker
    inc
    inc

    # objects and arrays (maps and lists)
    band is mp
      name 'Aterciopelados
      albums ls 'Oye 'Rio
      members mp
        leadSinger 'Andrea
        bass 'Hector

    # one-line objects
    person is mp name 'Drew age 27

</td><td>
## CoffeeScript
    # strings
    name = "Drew LeSueur"
    wife = "Aimee"
    
    # functions
    sayHi = (name) ->
      "hello #{name}"

    # one-line functions
    bang = -> alert "bang"
    
    # closure
    incMaker = ->
      x = 0
      -> x + 1
    inc = incMaker()
    inc()
    inc()

    # objects and arrays
    band =
      name: "Aterciopelados"
      albums: ["Oye", "Rio"]
      members:
        leadSinger: "Andrea"
        bass: "Hector"

    # one-line objects
    person = name: 'Drew', age: 27
</tr>
</tabe>
