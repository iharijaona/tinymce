define(
  'ephox.sherlock.demo.SherlockDemo',

  [
    'ephox.compass.Arr',
    'ephox.gift.api.BasicWrap',
    'ephox.gift.api.Wrapper',
    'ephox.sherlock.match.Matcher',
    'ephox.sherlock.match.Pattern',
    'ephox.sugar.api.Attr',
    'ephox.sugar.api.Class',
    'ephox.sugar.api.Css',
    'ephox.sugar.api.Element',
    'ephox.sugar.api.Event',
    'ephox.sugar.api.Insert',
    'ephox.sugar.api.InsertAll',
    'text!html/content.html'
  ],

  function (Arr, BasicWrap, Wrapper, Matcher, Pattern, Attr, Class, Css, Element, Event, Insert, InsertAll, ContentHtml) {
    return function () {
 
      var container = Element.fromTag('div');

      var content = Element.fromHtml(ContentHtml);
      var input = Element.fromTag('input');
      var button = Element.fromTag('button');
      Insert.append(button, Element.fromText('Highlight token'));
      Attr.set(button, 'type', 'input');

      var buttonWord = Element.fromTag('button');
      Attr.set(buttonWord, 'type', 'input');
      Insert.append(buttonWord, Element.fromText('Highlight word'));

      var wrapper = function () {
        var c = Element.fromTag('span');
        Class.add(c, 'highlighted');
        Css.set(c, 'background-color', '#cadbee');
        return BasicWrap(c);
      };

      Event.bind(button, 'click', function (event) {
        var token = Attr.get(input, 'value');
        var matches = Matcher.token([content], token);
        highlight(matches);
      });

      Event.bind(buttonWord, 'click', function (event) {
        var word = Attr.get(input, 'value');
        var matches = Matcher.word([content], word);
        highlight(matches);
      });

      var highlight = function (matches) {
        Arr.each(matches, function (x) {
          var match = x.get();
          match.each(function (v) {
            Wrapper.wrapWith(v.start().element(), v.start().offset(), v.finish().element(), v.finish().offset(), wrapper);
          });
        });
      };
      
      InsertAll.append(container, [input, button, buttonWord, content]);

      var ephoxUi = Element.fromDom(document.getElementById('ephox-ui'));
      Insert.append(ephoxUi, container);

    };
  }
);
