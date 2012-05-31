thumbs
======

A programming language for your thumbs

Compare with coffeescript

<table><tr><td>
## thumbs    
    # strings
    name is ' Drew LeSueur
    wife is 'Aimee

    # functions
    say-hi is fn name punctuation
      ' hello $name $punctuation

    say-hi 'world '!

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

    # access
    band.members.leadSinger 

    # set access
    band.members.drumbs is 'Catalina

    # not there access
    band.instruments.main is 'Guitar

    # function function calls
    save wp JSON.parse rawData

    # callbacks
    save-data 101 fn err answer
      say ' the answer is $answer

    # objects and then callbacks
    save-data
      mp left 100 right 101
      fn err answer 
        say "the answer is #{answer}"

    # if  (all functional)
      if
        f name.is 'intruder
        f say ' you are an intruder and can't enter
        f name.is 'bird
        f say ' fly on in

    # if again
      name.is 'intruder
        f say ' you are an intruder and can't enter
        f name.is 'bird
        f say ' fly on in

</td><td>
## CoffeeScript
    # strings
    name = "Drew LeSueur"
    wife = "Aimee"
    
    # functions
    sayHi = (name, punctuation) ->
      "hello #{name} #{punctuation}"

    sayHi "world", "!"

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

    # access
    band.members.leadSinger 

    # set access
    band.members.drumbs = 'Catalina'

    # not there access
    # n/a

    # function function calls
    save JSON.parse rawData

    # callbacks
    saveData 101, (err, answer) ->
      say "the answer is #{answer}"

    # objects and then callbacks
    saveData left: 100, right: 101 , (err, answer) ->
      say "the answer is #{answer}"

    # if
      if name is 'intruder'
        console.log 'you are an intruder and can't enter'
      else if name is "bird"
        console.log "fly on in"


    # if again (same in coffescript)
      if name is 'intruder'
        console.log 'you are an intruder and can't enter'
      else if name is "bird"
        console.log "fly on in"

</tr>
</tabe>
